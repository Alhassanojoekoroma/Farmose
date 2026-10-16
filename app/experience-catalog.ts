/** Select the products allowed on the replacement storefront. */
export function selectExperienceCatalog<T extends { slug: string; siteVisible: boolean }>(
  products: T[],
  designSlugs: string[],
) {
  const visible = products.filter((product) => product.siteVisible === true);
  const visibleSlugs = new Set(visible.map((product) => product.slug));
  const hiddenDesignSlugs = designSlugs
    .filter((slug) => !visibleSlugs.has(slug))
    .map((slug) => slug.replace(/^pantry-/, ""));
  return { products: visible, hiddenDesignSlugs };
}
