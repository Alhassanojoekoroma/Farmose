import { query } from "../lib/postgres";
import { defaultTheme, type Product, type SiteTheme } from "./farmose-data";

export type ManagedProduct = Product & {
  active: boolean;
  siteVisible: boolean;
  sortOrder: number;
};

type ProductRow = {
  slug: string; name: string; short_name: string; category: string; tag: string;
  price: string; unit: string; image: string; image_url: string | null;
  image_public_id: string | null; additional_images_json: string[] | string;
  stock_quantity: number; video: string; image_position: string; color: string;
  rating: string; reviews: number; description: string; details: string;
  features_json: string[] | string; active: boolean; site_visible: boolean;
  sort_order: number;
};

function stringList(value: string[] | string): string[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function rowToProduct(row: ProductRow): ManagedProduct {
  return {
    slug: row.slug,
    name: row.name,
    shortName: row.short_name,
    category: row.category as Product["category"],
    tag: row.tag,
    price: Number(row.price),
    unit: row.unit,
    image: row.image_url || row.image,
    imageUrl: row.image_url || row.image,
    imagePublicId: row.image_public_id ?? undefined,
    additionalImages: stringList(row.additional_images_json),
    stockQuantity: row.stock_quantity,
    video: row.video,
    imagePosition: row.image_position,
    color: row.color,
    rating: Number(row.rating),
    reviews: row.reviews,
    description: row.description,
    details: row.details,
    features: stringList(row.features_json),
    active: row.active,
    siteVisible: row.site_visible,
    sortOrder: row.sort_order,
  };
}

export async function readManagedProducts(includeInactive = false): Promise<ManagedProduct[]> {
  const rows = await query<ProductRow>(
    "SELECT * FROM catalog_products ORDER BY sort_order, slug",
  );
  const products = rows.map(rowToProduct);
  return includeInactive ? products : products.filter((product) => product.active);
}

export async function readSiteTheme(): Promise<SiteTheme> {
  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM site_settings");
  const stored = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  const numeric = (key: keyof SiteTheme, fallback: number) => {
    const value = Number(stored[key]);
    return Number.isFinite(value) ? value : fallback;
  };
  const backgroundColor = String(stored.backgroundColor ?? defaultTheme.backgroundColor).toLowerCase() === "#fbf7e9"
    ? "#e6fcd5"
    : String(stored.backgroundColor ?? defaultTheme.backgroundColor);
  return {
    ...defaultTheme,
    ...stored,
    backgroundColor,
    baseFontSize: numeric("baseFontSize", defaultTheme.baseFontSize),
    headingMaxSize: Math.min(76, Math.max(56, numeric("headingMaxSize", defaultTheme.headingMaxSize))),
    buttonRadius: numeric("buttonRadius", defaultTheme.buttonRadius),
  };
}

export async function saveSiteTheme(theme: SiteTheme) {
  for (const key of Object.keys(defaultTheme) as Array<keyof SiteTheme>) {
    const fallback = defaultTheme[key];
    const raw = theme[key];
    const value = typeof fallback === "number"
      ? (Number.isFinite(Number(raw)) ? String(Number(raw)) : String(fallback))
      : String(raw ?? fallback).slice(0, 4000);
    await query(
      "INSERT INTO site_settings (key, value, updated_at) VALUES ($1, $2, now()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
      [key, value],
    );
  }
}

export async function saveManagedProduct(product: ManagedProduct) {
  const values = [
    product.slug.trim(), product.name.trim(), product.shortName.trim(),
    product.category, product.tag, Number(product.price), product.unit.trim(),
    product.image || product.imageUrl || "/images/farmose-groundnut-display.webp",
    product.imageUrl || product.image || "/images/farmose-groundnut-display.webp",
    product.imagePublicId ?? null, JSON.stringify(product.additionalImages ?? []),
    Math.max(0, Math.floor(Number(product.stockQuantity) || 0)),
    product.video ?? "", product.imagePosition ?? "center", product.color,
    Number(product.rating) || 5, Number(product.reviews) || 0,
    product.description, product.details, JSON.stringify(product.features ?? []),
    product.active !== false, product.siteVisible === true, Number(product.sortOrder) || 0,
  ];
  await query(`INSERT INTO catalog_products (
    slug, name, short_name, category, tag, price, unit, image, image_url,
    image_public_id, additional_images_json, stock_quantity, video, image_position,
    color, rating, reviews, description, details, features_json, active, site_visible, sort_order, updated_at
  ) VALUES (
    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20::jsonb,$21,$22,$23,now()
  ) ON CONFLICT (slug) DO UPDATE SET
    name=EXCLUDED.name, short_name=EXCLUDED.short_name, category=EXCLUDED.category,
    tag=EXCLUDED.tag, price=EXCLUDED.price, unit=EXCLUDED.unit, image=EXCLUDED.image,
    image_url=EXCLUDED.image_url, image_public_id=EXCLUDED.image_public_id,
    additional_images_json=EXCLUDED.additional_images_json, stock_quantity=EXCLUDED.stock_quantity,
    video=EXCLUDED.video, image_position=EXCLUDED.image_position, color=EXCLUDED.color,
    rating=EXCLUDED.rating, reviews=EXCLUDED.reviews, description=EXCLUDED.description,
    details=EXCLUDED.details, features_json=EXCLUDED.features_json, active=EXCLUDED.active,
    site_visible=EXCLUDED.site_visible, sort_order=EXCLUDED.sort_order, updated_at=now()`, values);
}

export async function deleteManagedProduct(slug: string) {
  await query("DELETE FROM catalog_products WHERE slug = $1", [slug]);
}
