import { asc, eq } from "drizzle-orm";
import { env } from "cloudflare:workers";
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
  await d1.batch([
    d1.prepare(`CREATE TABLE IF NOT EXISTS catalog_products (
      slug text PRIMARY KEY NOT NULL,
      name text NOT NULL,
      short_name text NOT NULL,
      category text NOT NULL,
      tag text NOT NULL,
      price real NOT NULL,
      unit text NOT NULL,
      image text NOT NULL,
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
    d1.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key text PRIMARY KEY NOT NULL,
      value text NOT NULL,
      updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
    )`),
  ]);

  const productColumns = await d1.prepare("PRAGMA table_info(catalog_products)").all<{ name: string }>();
  if (!productColumns.results.some((column) => column.name === "video")) {
    try {
      await d1.prepare("ALTER TABLE catalog_products ADD COLUMN video text DEFAULT '' NOT NULL").run();
    } catch (error) {
      const refreshedColumns = await d1.prepare("PRAGMA table_info(catalog_products)").all<{ name: string }>();
      if (!refreshedColumns.results.some((column) => column.name === "video")) throw error;
    }
  }
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

  await db.batch(
    fallbackProducts.map((product, index) =>
      db.insert(catalogProducts).values({
        ...product,
        imagePosition: product.imagePosition ?? "center",
        featuresJson: JSON.stringify(product.features),
        active: true,
        sortOrder: index,
      }),
    ),
  );
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
  await db.batch(
    entries.map(([key, value]) =>
      db
        .insert(siteSettings)
        .values({ key, value: String(value), updatedAt: new Date().toISOString() })
        .onConflictDoUpdate({
          target: siteSettings.key,
          set: { value: String(value), updatedAt: new Date().toISOString() },
        }),
    ),
  );
}

export async function saveManagedProduct(product: ManagedProduct) {
  const now = new Date().toISOString();
  await getDb()
    .insert(catalogProducts)
    .values({
      slug: product.slug,
      name: product.name,
      shortName: product.shortName,
      category: product.category,
      tag: product.tag,
      price: product.price,
      unit: product.unit,
      image: product.image,
      video: product.video ?? "",
      imagePosition: product.imagePosition ?? "center",
      color: product.color,
      rating: product.rating,
      reviews: product.reviews,
      description: product.description,
      details: product.details,
      featuresJson: JSON.stringify(product.features),
      active: product.active,
      sortOrder: product.sortOrder,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: catalogProducts.slug,
      set: {
        name: product.name,
        shortName: product.shortName,
        category: product.category,
        tag: product.tag,
        price: product.price,
        unit: product.unit,
        image: product.image,
        video: product.video ?? "",
        imagePosition: product.imagePosition ?? "center",
        color: product.color,
        rating: product.rating,
        reviews: product.reviews,
        description: product.description,
        details: product.details,
        featuresJson: JSON.stringify(product.features),
        active: product.active,
        sortOrder: product.sortOrder,
        updatedAt: now,
      },
    });
}

export async function deleteManagedProduct(slug: string) {
  await getDb().delete(catalogProducts).where(eq(catalogProducts.slug, slug));
}
