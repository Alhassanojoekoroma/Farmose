import type { Metadata } from "next";
import { FarmoseExperience } from "../components/FarmoseExperience";
import { readExperienceStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pantry Enquiry",
  description: "Choose Farmose products and send an enquiry on WhatsApp.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const storefront = await readExperienceStorefront();
  return <FarmoseExperience initialRoute="pantry" {...storefront} />;
}
