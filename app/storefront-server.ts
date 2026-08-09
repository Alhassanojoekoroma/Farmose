import { readManagedProducts, readSiteTheme } from "./catalog-server";
import { defaultTheme, products as fallbackProducts } from "./farmose-data";
import { env } from "../lib/cloudflare-env";

export async function readStorefront() {
  try {
    const [products, theme] = await Promise.all([readManagedProducts(), readSiteTheme()]);
    return { products, theme };
  } catch (error) {
    if (env.DB) console.error("Unable to read the managed storefront; using bundled content.", error);
    return { products: fallbackProducts, theme: defaultTheme };
  }
}
