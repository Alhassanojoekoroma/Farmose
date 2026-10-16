import type { Metadata } from "next";
import { FarmoseExperience } from "../components/FarmoseExperience";
import { readExperienceStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Farmose",
  description: "Contact Farmose in Freetown about products and bulk enquiries.",
  alternates: { canonical: "/wholesale" },
};

export default async function WholesalePage() {
  const storefront = await readExperienceStorefront();
  return <FarmoseExperience initialRoute="contacts" {...storefront} />;
}
