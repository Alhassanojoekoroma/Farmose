import type { Product } from "./farmose-data";

export type ExperienceSeed = Product & {
  active: boolean;
  siteVisible: boolean;
  sortOrder: number;
  stockQuantity: number;
};

/** The eight products and supplied artwork in the replacement design. */
export const experienceProducts: ExperienceSeed[] = [
  {
    slug: "pantry-honey", name: "Raw Honey", shortName: "Raw Honey", category: "Pantry", tag: "Honey", price: 0, unit: "400 g",
    image: "/farmose/img/honey.webp", color: "#f0b400", rating: 5, reviews: 0,
    description: "Pure raw honey from Sierra Leone, poured straight into a squeeze bottle with a tamper-proof cap. Rich, dark and floral, it is left as nature made it.",
    details: "Squeeze bottle", features: ["Stir into tea, spoon over warm bread or porridge, or use it to glaze roasted vegetables and meat.", "Keep at room temperature, tightly closed. Crystallising is natural; warm the bottle gently to soften it.", "Raw honey. Product of Sierra Leone."],
    active: true, siteVisible: true, sortOrder: 0, stockQuantity: 100,
  },
  {
    slug: "pantry-groundnut-paste", name: "Groundnut Paste", shortName: "Groundnut Paste", category: "Pantry", tag: "Pastes", price: 0, unit: "950 g",
    image: "/farmose/img/groundnut-950.webp", color: "#d98a2b", rating: 5, reviews: 0,
    description: "One ingredient: ground groundnuts. A smooth, deeply roasted paste that is the base of Sierra Leonean sauces and just as good on a slice of bread.",
    details: "Jar", features: ["Use in spreads, dips and smoothies, or as a base for sauces and stews.", "Store in a cool, dry place to maintain freshness. Stir if the oil rises.", "One ingredient. Ground groundnuts."],
    active: true, siteVisible: true, sortOrder: 1, stockQuantity: 100,
  },
  {
    slug: "pantry-cayenne-pepper", name: "Cayenne Pepper", shortName: "Cayenne Pepper", category: "Pantry", tag: "Spices", price: 0, unit: "350 g",
    image: "/farmose/img/pepper.webp", color: "#d63a2f", rating: 5, reviews: 0,
    description: "Sun-red cayenne, ground and packed in a clear jar so you can see the colour. Bright heat that lifts soups, grills and rice.",
    details: "Jar", features: ["Start with a pinch in stews, marinades and sauces, then build the heat to taste.", "Keep in a cool, dry place with the lid tightly closed.", "Ground cayenne pepper."],
    active: true, siteVisible: true, sortOrder: 2, stockQuantity: 100,
  },
  {
    slug: "pantry-keinda", name: "Keinda", shortName: "Keinda", category: "Pantry", tag: "Fermented seasoning", price: 0, unit: "370 g",
    image: "/farmose/img/keinda.webp", color: "#7f9aa3", rating: 5, reviews: 0,
    description: "Fermented locust beans, ground into a deep, savoury seasoning. A small spoonful gives soups and stews their unmistakable depth.",
    details: "Jar", features: ["Stir into soups, stews and rice dishes towards the end of cooking.", "Keep in a cool, dry place with the lid tightly closed.", "Fermented locust beans."],
    active: true, siteVisible: true, sortOrder: 3, stockQuantity: 100,
  },
  {
    slug: "pantry-palm-oil", name: "Palm Oil", shortName: "Palm Oil", category: "Pantry", tag: "Oils", price: 0, unit: "5 L",
    image: "/farmose/img/palm-oil.webp", color: "#c8251c", rating: 5, reviews: 0,
    description: "100% pure and natural palm oil in a 5 litre carry pouch. No additives, no preservatives, rich in vitamin E and a source of vitamin A, with zero trans fat.",
    details: "5 L pouch", features: ["The classic base for palm oil stews, jollof and soups, or to fry plantain.", "Keep away from heat and direct sun. Reseal the cap after each use.", "No additives. No preservatives. Zero trans fat."],
    active: true, siteVisible: true, sortOrder: 4, stockQuantity: 100,
  },
  {
    slug: "pantry-benny", name: "Benny", shortName: "Benny", category: "Pantry", tag: "Seeds", price: 0, unit: "450 g",
    image: "/farmose/img/benny.webp", color: "#2f9d4f", rating: 5, reviews: 0,
    description: "Ground sesame seeds, known in Sierra Leone as benny. Nutty and fragrant, they thicken and enrich sauces and sweets.",
    details: "Jar", features: ["Sprinkle on rice and vegetables, or stir into sauces and traditional sweets.", "Keep in a cool, dry place with the lid tightly closed.", "Ground sesame seeds."],
    active: true, siteVisible: true, sortOrder: 5, stockQuantity: 100,
  },
  {
    slug: "pantry-tola", name: "Tola", shortName: "Tola", category: "Pantry", tag: "Ground spice", price: 0, unit: "350 g",
    image: "/farmose/img/tola.webp", color: "#7a3f26", rating: 5, reviews: 0,
    description: "Ground tola, a traditional Sierra Leonean ingredient milled fine and sealed under a blue cap. Earthy, warm and made for the home kitchen.",
    details: "Jar", features: ["Add to soups and stews and cook gently so the flavour opens up.", "Keep in a cool, dry place with the lid tightly closed.", "Ground tola."],
    active: true, siteVisible: true, sortOrder: 6, stockQuantity: 100,
  },
  {
    slug: "pantry-groundnut-paste-2kg", name: "Groundnut Paste", shortName: "Groundnut Paste 2 kg", category: "Pantry", tag: "Pastes", price: 0, unit: "2 kg",
    image: "/farmose/img/groundnut-2kg.webp", color: "#b9792f", rating: 5, reviews: 0,
    description: "The family and kitchen size: two kilos of smooth groundnut paste. Ground groundnuts only, ready for spreads, dips, smoothies and sauces.",
    details: "2 kg tub", features: ["In spreads, dips, smoothies or as a base for sauces.", "Store in a cool, dry place to maintain freshness.", "Two kilos. One ingredient."],
    active: true, siteVisible: true, sortOrder: 7, stockQuantity: 100,
  },
];
