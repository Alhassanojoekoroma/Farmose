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
import { query } from "../../../../lib/postgres";

export const dynamic = "force-dynamic";

const categories = ["Pantry", "Fresh Seafood", "Meat & Poultry", "Fresh Produce"];

export async function GET() {
  const auth = await requireAdminApi();
  if (auth instanceof Response) return auth;
  try {
    const [products, theme, recentOrders] = await Promise.all([
      hasAdminPermission(auth, "products") ? readManagedProducts(true) : Promise.resolve([]),
      hasAdminPermission(auth, "content") ? readSiteTheme() : Promise.resolve(defaultTheme),
      hasAdminPermission(auth, "orders") ? query<{
        id: number; order_number: string; customer_name: string; phone: string;
        area: string; payment_method: string; total: string; status: string; created_at: Date;
      }>("SELECT id, order_number, customer_name, phone, area, payment_method, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 50") : Promise.resolve([]),
    ]);
    return Response.json({ products, theme, orders: recentOrders.map((order) => ({
      id: Number(order.id), orderNumber: order.order_number, customerName: order.customer_name,
      phone: order.phone, area: order.area, paymentMethod: order.payment_method,
      total: Number(order.total), status: order.status, createdAt: order.created_at.toISOString(),
    })), admin: auth.displayName });
  } catch (error) {
    console.error("Admin catalog read failed", error);
    return Response.json({ error: "The administration data is temporarily unavailable." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const auth = await requireAdminApi(undefined, request);
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
    if (!hasAdminPermission(auth, "content")) return Response.json({ error: "Content access is required." }, { status: 403 });
    if (!payload.theme || typeof payload.theme !== "object") return Response.json({ error: "Site content is required." }, { status: 400 });
    try {
      await saveSiteTheme(payload.theme);
      return Response.json({ ok: true });
    } catch (error) {
      console.error("Site content save failed", error);
      return Response.json({ error: "Site content could not be saved." }, { status: 503 });
    }
  }

  if (!hasAdminPermission(auth, "products")) return Response.json({ error: "Product access is required." }, { status: 403 });

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
  const auth = await requireAdminApi("products", request);
  if (auth instanceof Response) return auth;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!slug) return Response.json({ error: "A product slug is required." }, { status: 400 });
  try {
    await deleteManagedProduct(slug);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Catalog product delete failed", error);
    return Response.json({ error: "The product could not be deleted." }, { status: 500 });
  }
}
