import { desc, eq } from "drizzle-orm";
import { hasAdminPermission, requireAdminApi } from "../../../admin-auth";
import {
  deleteManagedProduct,
  ManagedProduct,
  readManagedProducts,
  readSiteTheme,
  saveManagedProduct,
  saveSiteTheme,
} from "../../../catalog-server";
import { defaultTheme, SiteTheme } from "../../../farmose-data";
import { getDb } from "../../../../db";
import { catalogProducts, orders } from "../../../../db/schema";
import { deleteProductImage } from "../../../../lib/cloudinary";

export const dynamic = "force-dynamic";

const categories = ["Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  const [products, theme, recentOrders] = await Promise.all([
    hasAdminPermission(auth.role, "products") ? readManagedProducts(true) : Promise.resolve([]),
    hasAdminPermission(auth.role, "content") ? readSiteTheme() : Promise.resolve(defaultTheme),
    hasAdminPermission(auth.role, "orders") ? getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(50).catch(() => []) : Promise.resolve([]),
  ]);
  return Response.json({ products, theme, orders: recentOrders, admin: auth.displayName });
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;

  let payload: { type?: string; product?: ManagedProduct; theme?: SiteTheme };
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "A valid JSON request is required." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !["product", "theme"].includes(payload.type ?? "")) {
    return Response.json({ error: "A product or theme update is required." }, { status: 400 });
  }

  if (payload.type === "theme") {
    if (!hasAdminPermission(auth.role, "content")) return Response.json({ error: "Content access is required." }, { status: 403 });
    if (!payload.theme || typeof payload.theme !== "object") return Response.json({ error: "Site content is required." }, { status: 400 });
    await saveSiteTheme(payload.theme);
    return Response.json({ ok: true });
  }

  if (!hasAdminPermission(auth.role, "products")) return Response.json({ error: "Product access is required." }, { status: 403 });

  const product = payload.product;
  if (!product || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug)) {
    return Response.json({ error: "Use a lowercase product slug with words separated by hyphens." }, { status: 400 });
  }
  if (typeof product.name !== "string" || typeof product.shortName !== "string" || typeof product.unit !== "string" || !product.name.trim() || !product.shortName.trim() || !product.unit.trim() || !categories.includes(product.category)) {
    return Response.json({ error: "Product name, short name, unit and a valid category are required." }, { status: 400 });
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
      features: Array.isArray(product.features) ? product.features.filter((feature): feature is string => typeof feature === "string" && Boolean(feature)).slice(0, 3) : [],
      siteVisible: product.siteVisible === true,
      stockQuantity: Math.max(0, Math.floor(Number(product.stockQuantity) || 0)),
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Catalog product save failed", error);
    return Response.json({ error: "The product could not be saved to the datastore." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAdminApi("products");
  if (auth instanceof Response) return auth;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return Response.json({ error: "A product slug is required." }, { status: 400 });
  try {
    const existing = await getDb().select({ imagePublicId: catalogProducts.imagePublicId }).from(catalogProducts).where(eq(catalogProducts.slug, slug)).limit(1);
    await deleteManagedProduct(slug);
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
