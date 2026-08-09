import { asc, eq } from "drizzle-orm";
import { env } from "../lib/cloudflare-env";
import { getDb } from "../db";
import { catalogProducts, siteSettings } from "../db/schema";
import {
  defaultTheme,
  products as fallbackProducts,
  Product,
  SiteTheme,
} from "./farmose-data";

export type ManagedProduct = Product & {
  active: boolean;
  sortOrder: number;
};

type ProductRow = typeof catalogProducts.$inferSelect;

async function ensureCatalogTables() {
  const d1 = env.DB;
  if (!d1) return;
  const database = d1;
  await database.batch([
    database.prepare(`CREATE TABLE IF NOT EXISTS catalog_products (
      slug text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      short_name text NOT NULL,
      category text NOT NULL,
      tag text NOT NULL,
      price real NOT NULL,
      unit text NOT NULL,
      image text NOT NULL,
      image_url text,
      image_public_id text,
      additional_images_json text DEFAULT '[]' NOT NULL,
      stock_quantity integer DEFAULT 0 NOT NULL,
      video text DEFAULT '' NOT NULL,
      image_position text DEFAULT 'center' NOT NULL,
      color text NOT NULL,
      rating real DEFAULT 5 NOT NULL,
      reviews integer DEFAULT 0 NOT NULL,
      description text NOT NULL,
      details text NOT NULL,
      features_json text DEFAULT '[]' NOT NULL,
      active integer DEFAULT true NOT NULL,
      sort_order integer DEFAULT 0 NOT NULL,
      updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
    database.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key text PRIMARY KEY NOT NULL,
      value text NOT NULL,
      updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
  ]);

  async function ensureColumn(name: string, definition: string) {
    const productColumns = await database.prepare("PRAGMA table_info(catalog_products)").all<{ name: string }>();
    if (productColumns.results.some((column) => column.name === name)) return;
    try {
      await database.prepare(`ALTER TABLE catalog_products ADD COLUMN ${definition}`).run();
    } catch (error) {
      const refreshedColumns = await database.prepare("PRAGMA table_info(catalog_products)").all<{ name: string }>();
      if (!refreshedColumns.results.some((column) => column.name === name)) throw error;
    }
  }

  await ensureColumn("image_url", "image_url text");
  await ensureColumn("image_public_id", "image_public_id text");
  await ensureColumn("additional_images_json", "additional_images_json text DEFAULT '[]' NOT NULL");
  await ensureColumn("stock_quantity", "stock_quantity integer DEFAULT 0 NOT NULL");
  await ensureColumn("video", "video text DEFAULT '' NOT NULL");
}

function rowToProduct(row: ProductRow): ManagedProduct {
  let features: string[] = [];
  try {
    features = JSON.parse(row.featuresJson) as string[];
  } catch {
    features = [];
  }

  return {
    slug: row.slug,
    name: row.name,
    shortName: row.shortName,
    category: row.category as Product["category"],
    tag: row.tag,
    price: row.price,
    unit: row.unit,
    image: row.image,
    imageUrl: row.imageUrl ?? row.image,
    imagePublicId: row.imagePublicId ?? undefined,
    additionalImages: (() => {
      try {
        return JSON.parse(row.additionalImagesJson ?? "[]") as string[];
      } catch {
        return [];
      }
    })(),
    stockQuantity: row.stockQuantity ?? 0,
    video: row.video,
    imagePosition: row.imagePosition,
    color: row.color,
    rating: row.rating,
    reviews: row.reviews,
    description: row.description,
    details: row.details,
    features,
    active: row.active,
    sortOrder: row.sortOrder,
  };
}

export async function ensureCatalogSeeded() {
  await ensureCatalogTables();
  const db = getDb();
  const existing = await db.select({ slug: catalogProducts.slug }).from(catalogProducts).limit(1);
  if (existing.length > 0) return;

  const seedStatements = fallbackProducts.map((product, index) =>
    db.insert(catalogProducts).values({
      ...product,
      imagePosition: product.imagePosition ?? "center",
      featuresJson: JSON.stringify(product.features),
      active: true,
      sortOrder: index,
    }),
  );
  await Promise.all(seedStatements.map((statement) => statement));
}

export async function readManagedProducts(includeInactive = false): Promise<ManagedProduct[]> {
  await ensureCatalogSeeded();
  const rows = await getDb().select().from(catalogProducts).orderBy(asc(catalogProducts.sortOrder));
  const mapped = rows.map(rowToProduct);
  return includeInactive ? mapped : mapped.filter((product) => product.active);
}

export async function readSiteTheme(): Promise<SiteTheme> {
  await ensureCatalogTables();
  const rows = await getDb().select().from(siteSettings);
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const numeric = (key: keyof SiteTheme, fallback: number) => {
    const value = Number(stored[key]);
    return Number.isFinite(value) ? value : fallback;
  };

  return {
    ...defaultTheme,
    ...stored,
    baseFontSize: numeric("baseFontSize", defaultTheme.baseFontSize),
    headingMaxSize: Math.min(76, Math.max(56, numeric("headingMaxSize", defaultTheme.headingMaxSize))),
    buttonRadius: numeric("buttonRadius", defaultTheme.buttonRadius),
  };
}

export async function saveSiteTheme(theme: SiteTheme) {
  const db = getDb();
  const entries = Object.entries(theme);
  const seedStatements = entries.map(([key, value]) =>
    db
      .insert(siteSettings)
      .values({ key, value: String(value), updatedAt: new Date().toISOString() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: String(value), updatedAt: new Date().toISOString() },
      }),
  );
  await Promise.all(seedStatements.map((statement) => statement));
}

export async function saveManagedProduct(product: ManagedProduct) {
  await ensureCatalogTables();
  const d1 = env.DB;
  if (!d1) throw new Error("Cloudflare D1 binding `DB` is unavailable.");
  const now = new Date().toISOString();
  const values = {
    slug: String(product.slug ?? "").trim(),
    name: String(product.name ?? "").trim(),
    shortName: String(product.shortName ?? "").trim(),
    category: String(product.category ?? "Pantry"),
    tag: String(product.tag ?? ""),
    price: Number(product.price) || 0,
    unit: String(product.unit ?? ""),
    image: String(product.image ?? "/images/farmose-groundnut-display.webp"),
    video: String(product.video ?? ""),
    imagePosition: String(product.imagePosition ?? "center"),
    color: String(product.color ?? "#d9e9b5"),
    rating: Number(product.rating) || 5,
    reviews: Number(product.reviews) || 0,
    description: String(product.description ?? ""),
    details: String(product.details ?? ""),
    featuresJson: JSON.stringify(Array.isArray(product.features) ? product.features : []),
    active: product.active === false ? 0 : 1,
    sortOrder: Number(product.sortOrder) || 0,
  };

  await d1.prepare(`INSERT INTO catalog_products (
    slug, name, short_name, category, tag, price, unit, image, video,
    image_position, color, rating, reviews, description, details,
    features_json, active, sort_order, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(slug) DO UPDATE SET
    name = excluded.name,
    short_name = excluded.short_name,
    category = excluded.category,
    tag = excluded.tag,
    price = excluded.price,
    unit = excluded.unit,
    image = excluded.image,
    video = excluded.video,
    image_position = excluded.image_position,
    color = excluded.color,
    rating = excluded.rating,
    reviews = excluded.reviews,
    description = excluded.description,
    details = excluded.details,
    features_json = excluded.features_json,
    active = excluded.active,
    sort_order = excluded.sort_order,
    updated_at = excluded.updated_at`).bind(
      values.slug,
      values.name,
      values.shortName,
      values.category,
      values.tag,
      values.price,
      values.unit,
      values.image,
      values.video,
      values.imagePosition,
      values.color,
      values.rating,
      values.reviews,
      values.description,
      values.details,
      values.featuresJson,
      values.active,
      values.sortOrder,
      now,
    ).run();
}

export async function deleteManagedProduct(slug: string) {
  await getDb().delete(catalogProducts).where(eq(catalogProducts.slug, slug));
}
