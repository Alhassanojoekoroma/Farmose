import { defaultTheme, products as fallbackProducts } from "../../farmose-data";
import { readManagedProducts, readSiteTheme } from "../../catalog-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [products, theme] = await Promise.all([readManagedProducts(), readSiteTheme()]);
    return Response.json(
      { products, theme },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return Response.json({ products: fallbackProducts, theme: defaultTheme });
  }
}
