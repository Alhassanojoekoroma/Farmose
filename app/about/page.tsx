import type { Metadata } from "next";
import { FarmoseExperience } from "../components/FarmoseExperience";
import { readExperienceStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story & Contact",
  description: "Learn about Farmose products made in Sierra Leone.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const storefront = await readExperienceStorefront();
  return <FarmoseExperience initialRoute="about" {...storefront} />;
}
