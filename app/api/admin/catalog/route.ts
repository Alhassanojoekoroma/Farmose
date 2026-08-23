import { desc, eq } from "drizzle-orm";
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
import { catalogProducts, orders } from "../../../../db/schema";
import { deleteProductImage } from "../../../../lib/cloudinary";
import { deleteProductFromSupabase, saveProductToSupabase } from "../../../../lib/supabase-products";

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

  try {
    const primaryImage = String(product.image || product.imageUrl || "/images/farmose-groundnut-display.webp");
    await saveManagedProduct({
      ...product,
      image: primaryImage,
      imageUrl: primaryImage,
      price: Number(product.price),
      rating: Number(product.rating) || 5,
      reviews: Number(product.reviews) || 0,
      sortOrder: Number(product.sortOrder) || 0,
      features: product.features.filter(Boolean).slice(0, 3),
    });
    await saveProductToSupabase({
      slug: product.slug,
      name: product.name,
      short_name: product.shortName,
      shortName: product.shortName,
      category: product.category,
      tag: product.tag,
      price: Number(product.price),
      unit: product.unit,
      image_url: primaryImage,
      image_public_id: product.imagePublicId ?? null,
      additional_images: (product.additionalImages ?? []).map((url) => ({ url, publicId: "" })),
      stock_quantity: product.stockQuantity ?? 0,
      description: product.description,
      details: product.details,
      features: product.features.filter(Boolean).slice(0, 3),
      active: product.active,
      sort_order: Number(product.sortOrder) || 0,
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Catalog product save failed", error);
    return Response.json({ error: "The product could not be saved to the datastore." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return Response.json({ error: "A product slug is required." }, { status: 400 });
  try {
    const existing = await getDb().select({ imagePublicId: catalogProducts.imagePublicId }).from(catalogProducts).where(eq(catalogProducts.slug, slug)).limit(1);
    await deleteManagedProduct(slug);
    await deleteProductFromSupabase(slug);
    const publicId = existing[0]?.imagePublicId;
    if (publicId) {
      try {
        await deleteProductImage(publicId);
      } catch (error) {
        console.error("Cloudinary cleanup failed", error);
      }
    }
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Catalog product delete failed", error);
    return Response.json({ error: "The product could not be deleted." }, { status: 500 });
  }
}
