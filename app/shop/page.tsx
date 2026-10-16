import type { Metadata } from "next";
import { FarmoseExperience } from "../components/FarmoseExperience";
import { readExperienceStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pantry",
  description: "Explore Farmose groundnut paste, honey, palm oil and spices made in Sierra Leone.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage() {
  const storefront = await readExperienceStorefront();
  return <FarmoseExperience initialRoute="pantry" {...storefront} />;
}
