import { defaultTheme } from "../../farmose-data";
import { experienceProducts } from "../../farmose-experience-products";
import { readManagedProducts, readSiteTheme } from "../../catalog-server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [allProducts, theme] = await Promise.all([readManagedProducts(true), readSiteTheme()]);
    const products = allProducts.filter((product) => product.siteVisible);
    return Response.json(
      { products, theme },
      { headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=120" } },
    );
  } catch {
    return Response.json({ products: experienceProducts, theme: defaultTheme });
  }
}
