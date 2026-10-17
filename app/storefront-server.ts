import { readManagedProducts, readSiteTheme } from "./catalog-server";
import { defaultTheme, products as fallbackProducts } from "./farmose-data";
import { experienceProducts } from "./farmose-experience-products";
import { selectExperienceCatalog } from "./experience-catalog";
import { readPublicUpdates } from "../lib/updates";

export async function readStorefront() {
  try {
    const [products, theme] = await Promise.all([readManagedProducts(), readSiteTheme()]);
    return { products, theme };
  } catch (error) {
    console.error("Unable to read the managed storefront; using bundled content.", error);
    return { products: fallbackProducts, theme: defaultTheme };
  }
}

export async function readExperienceStorefront() {
  try {
    const [products, theme, updates] = await Promise.all([readManagedProducts(true), readSiteTheme(), readPublicUpdates()]);
    return { ...selectExperienceCatalog(products, experienceProducts.map((product) => product.slug)), theme, updates };
  } catch (error) {
    console.error("Unable to read the Farmose experience catalog; using packaged products.", error);
    return { products: experienceProducts, hiddenDesignSlugs: [], theme: defaultTheme, updates: [] };
  }
}
