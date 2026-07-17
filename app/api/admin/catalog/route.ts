import { desc } from "drizzle-orm";
import { requireAdminApi } from "../../../admin-auth";
import {
  deleteManagedProduct,
  ManagedProduct,
  readManagedProducts,
  readSiteTheme,
  saveManagedProduct,
  saveSiteTheme,
} from "../../../catalog-server";
import { SiteTheme } from "../../../farmose-data";
import { getDb } from "../../../../db";
import { orders } from "../../../../db/schema";

export const dynamic = "force-dynamic";

const categories = ["Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const [products, theme, recentOrders] = await Promise.all([
    readManagedProducts(true),
    readSiteTheme(),
    getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(50).catch(() => []),
  ]);
  return Response.json({ products, theme, orders: recentOrders, admin: auth.displayName });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const payload = (await request.json()) as
    | { type: "product"; product: ManagedProduct }
    | { type: "theme"; theme: SiteTheme };

  if (payload.type === "theme") {
    await saveSiteTheme(payload.theme);
    return Response.json({ ok: true });
  }

  const product = payload.product;
  if (!product || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) {
    return Response.json({ error: "Use a lowercase product slug with words separated by hyphens." }, { status: 400 });
  }
  if (!product.name.trim() || !product.shortName.trim() || !categories.includes(product.category)) {
    return Response.json({ error: "Product name, short name and a valid category are required." }, { status: 400 });
  }
  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) {
    return Response.json({ error: "Enter a valid product price." }, { status: 400 });
  }

  await saveManagedProduct({
    ...product,
    price: Number(product.price),
    rating: Number(product.rating) || 5,
    reviews: Number(product.reviews) || 0,
    sortOrder: Number(product.sortOrder) || 0,
    features: product.features.filter(Boolean).slice(0, 3),
  });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return Response.json({ error: "A product slug is required." }, { status: 400 });
  await deleteManagedProduct(slug);
  return Response.json({ ok: true });
}
