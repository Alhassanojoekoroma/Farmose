export type Product = {
  slug: string;
  name: string;
  shortName: string;
  category: "Pantry" | "Fresh Seafood" | "Meat & Poultry" | "Fresh Produce";
  tag: string;
  price: number;
  unit: string;
  image: string;
  video?: string;
  imagePosition?: string;
  color: string;
  rating: number;
  reviews: number;
  description: string;
  details: string;
  features: string[];
};

export type SiteTheme = {
  primaryColor: string;
  backgroundColor: string;
  accentColor: string;
  highlightColor: string;
  bodyFont: string;
  headingFont: string;
  baseFontSize: number;
  headingMaxSize: number;
  buttonRadius: number;
  announcement: string;
  heroTitle: string;
  heroEmphasis: string;
  heroBody: string;
  heroImage: string;
};

export const defaultTheme: SiteTheme = {
  primaryColor: "#063f2f",
  backgroundColor: "#fbf7e9",
  accentColor: "#ff7a2f",
  highlightColor: "#cfe1f6",
  bodyFont: "Arial, Helvetica, sans-serif",
  headingFont: "Georgia, 'Times New Roman', serif",
  baseFontSize: 16,
  headingMaxSize: 66,
  buttonRadius: 999,
  announcement: "FREE DELIVERY IN FREETOWN ON ORDERS OVER LE 500",
  heroTitle: "From our farms to your kitchen —",
  heroEmphasis: "beautifully clean.",
  heroBody:
    "Premium Sierra Leonean ingredients, carefully washed, processed and packed to save you time without losing the local flavour you love.",
  heroImage: "/images/farmose-peppers.webp",
};

export const products: Product[] = [
  {
    slug: "groundnut-paste-950g",
    name: "Farmose Groundnut Paste",
    shortName: "Groundnut Paste",
    category: "Pantry",
    tag: "BESTSELLER",
    price: 180,
    unit: "950 g jar",
    image: "/images/farmose-groundnut-shelf.webp",
    imagePosition: "center 44%",
    color: "#f4c77f",
    rating: 4.9,
    reviews: 28,
    description:
      "Rich, smooth local groundnut paste made in Sierra Leone. Cleanly processed for easy breakfasts, sauces and everyday cooking.",
    details:
      "Made from carefully selected groundnuts and processed in a hygienic environment for a full roasted flavour with none of the grit.",
    features: ["Locally made", "Sand-free", "Family size"],
  },
  {
    slug: "benny-ground-sesame-450g",
    name: "Farmose Benny — Ground Sesame",
    shortName: "Benny",
    category: "Pantry",
    tag: "LOCAL FAVOURITE",
    price: 95,
    unit: "450 g jar",
    image: "/images/farmose-benny.webp",
    imagePosition: "center 48%",
    color: "#bfe28b",
    rating: 5,
    reviews: 16,
    description:
      "Finely ground sesame seeds, prepared locally for soups, sauces and traditional dishes without the usual washing and sorting.",
    details:
      "Our Benny is cleaned, sorted and ground in small batches. Open the jar and cook — no stones, no sand, no extra prep.",
    features: ["Ready to cook", "100% sesame", "Small-batch"],
  },
  {
    slug: "fresh-local-peppers",
    name: "Fresh Local Pepper Selection",
    shortName: "Local Peppers",
    category: "Fresh Produce",
    tag: "FARM FRESH",
    price: 45,
    unit: "250 g pack",
    image: "/images/farmose-peppers.webp",
    imagePosition: "center 60%",
    color: "#ff9f72",
    rating: 4.8,
    reviews: 21,
    description:
      "A colourful selection of fresh Sierra Leonean peppers, carefully sorted and packed for your kitchen.",
    details:
      "Seasonal peppers sourced from local growers and handled with the clean, careful standard Farmose is known for.",
    features: ["Local harvest", "Hand-sorted", "Freshly packed"],
  },
  {
    slug: "live-farm-raised-catfish",
    name: "Live Farm-Raised Catfish",
    shortName: "Live Catfish",
    category: "Fresh Seafood",
    tag: "LIVE & FRESH",
    price: 120,
    unit: "per kg",
    image: "/images/farmose-peppers.webp",
    imagePosition: "right center",
    color: "#acd9e9",
    rating: 4.9,
    reviews: 34,
    description:
      "Fresh farm-raised catfish, available live or expertly processed and cleaned to your preference.",
    details:
      "Choose live pickup or let our team process and clean your fish before delivery. Bulk restaurant quantities are available.",
    features: ["Farm-raised", "Cleaned to order", "Bulk available"],
  },
  {
    slug: "cleaned-atlantic-snapper",
    name: "Cleaned Atlantic Snapper",
    shortName: "Atlantic Snapper",
    category: "Fresh Seafood",
    tag: "KITCHEN READY",
    price: 160,
    unit: "per kg",
    image: "/images/farmose-groundnut-display.webp",
    imagePosition: "center 58%",
    color: "#d5e6f7",
    rating: 5,
    reviews: 12,
    description:
      "Atlantic snapper, fully descaled, gutted and thoroughly cleaned — ready for seasoning and cooking.",
    details:
      "A premium fish-counter experience without the mess. We handle the scaling and cleaning so you can go straight to the pot.",
    features: ["Fully descaled", "Thoroughly cleaned", "Same-day prep"],
  },
  {
    slug: "clean-black-eyed-beans",
    name: "Pre-Cleaned Black-Eyed Beans",
    shortName: "Black-Eyed Beans",
    category: "Pantry",
    tag: "SAND-FREE",
    price: 65,
    unit: "1 kg pack",
    image: "/images/farmose-benny.webp",
    imagePosition: "left 55%",
    color: "#e6d7bc",
    rating: 4.8,
    reviews: 19,
    description:
      "Carefully sorted and pre-cleaned black-eyed beans that save time and keep grit out of the family pot.",
    details:
      "We remove dust, stones and unwanted particles before packing. Rinse lightly, soak and cook with confidence.",
    features: ["Pre-cleaned", "Stone-free", "Time-saving"],
  },
  {
    slug: "processed-catfish",
    name: "Processed Farm-Raised Catfish",
    shortName: "Processed Catfish",
    category: "Fresh Seafood",
    tag: "CLEANED TO ORDER",
    price: 135,
    unit: "per kg",
    image: "/images/farmose-peppers.webp",
    imagePosition: "center",
    color: "#c7e5ef",
    rating: 4.9,
    reviews: 22,
    description: "Farm-raised catfish, expertly processed and thoroughly cleaned before it reaches your kitchen.",
    details: "Choose your preferred cuts and let our fish team handle the cleaning, gutting and preparation before pickup or delivery.",
    features: ["Cleaned to order", "Farm-raised", "Kitchen ready"],
  },
  {
    slug: "cleaned-atlantic-grouper",
    name: "Cleaned Atlantic Grouper",
    shortName: "Atlantic Grouper",
    category: "Fresh Seafood",
    tag: "KITCHEN READY",
    price: 175,
    unit: "per kg",
    image: "/images/farmose-groundnut-display.webp",
    imagePosition: "center",
    color: "#d9e8f5",
    rating: 4.8,
    reviews: 14,
    description: "Firm, fresh Atlantic grouper, fully descaled and cleaned for effortless home cooking.",
    details: "Prepared by our fish-counter team and packed cleanly to protect freshness on the journey to your kitchen.",
    features: ["Fully descaled", "Freshly packed", "Bulk available"],
  },
  {
    slug: "cleaned-spent-chicken",
    name: "Thoroughly Cleaned Spent Chicken",
    shortName: "Spent Chicken",
    category: "Meat & Poultry",
    tag: "LOCALLY SOURCED",
    price: 145,
    unit: "whole bird",
    image: "/images/farmose-groundnut-display.webp",
    imagePosition: "center",
    color: "#f4d4ad",
    rating: 4.9,
    reviews: 18,
    description: "Premium local spent chicken, thoroughly cleaned and packed for soups, stews and family meals.",
    details: "A full-flavoured local favourite with the time-consuming cleaning already handled by our team.",
    features: ["Thoroughly cleaned", "Local poultry", "Full flavour"],
  },
  {
    slug: "premium-local-beef",
    name: "Premium Local Beef Cuts",
    shortName: "Local Beef",
    category: "Meat & Poultry",
    tag: "FRESH CUT",
    price: 150,
    unit: "per kg",
    image: "/images/farmose-groundnut-shelf.webp",
    imagePosition: "center",
    color: "#eac0aa",
    rating: 4.8,
    reviews: 11,
    description: "Fresh local beef selected and prepared for everyday Sierra Leonean cooking.",
    details: "Tell us the dish you are making and our team can help you choose a suitable cut and quantity.",
    features: ["Fresh cut", "Local supply", "Portioned to order"],
  },
  {
    slug: "pre-cleaned-broad-beans",
    name: "Pre-Cleaned Broad Beans",
    shortName: "Broad Beans",
    category: "Pantry",
    tag: "SAND-FREE",
    price: 70,
    unit: "1 kg pack",
    image: "/images/farmose-benny.webp",
    imagePosition: "center",
    color: "#d9e9b5",
    rating: 4.7,
    reviews: 13,
    description: "Sorted broad beans with stones, dust and grit removed before packing.",
    details: "A dependable pantry staple that saves preparation time while keeping familiar local recipes tasting right.",
    features: ["Pre-cleaned", "Stone-free", "Pantry ready"],
  },
  {
    slug: "cleaned-local-groundnuts",
    name: "Pre-Cleaned Local Groundnuts",
    shortName: "Local Groundnuts",
    category: "Pantry",
    tag: "READY TO USE",
    price: 75,
    unit: "1 kg pack",
    image: "/images/farmose-groundnut-shelf.webp",
    imagePosition: "center",
    color: "#f1d08d",
    rating: 4.9,
    reviews: 25,
    description: "Local groundnuts carefully sorted and cleaned for roasting, cooking or homemade paste.",
    details: "Clean, dependable groundnuts with the dust and sorting already handled for you.",
    features: ["Locally grown", "Hand-sorted", "Sand-free"],
  },
];

export const money = (amount: number) => `Le ${amount.toFixed(2)}`;
