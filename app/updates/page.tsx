import type { Metadata } from "next";
import { FarmoseExperience } from "../components/FarmoseExperience";
import { readExperienceStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "News & offers",
  description: "Farmose promotions, news, visits and programs.",
  alternates: { canonical: "/updates" },
};

export default async function UpdatesPage() {
  return <FarmoseExperience initialRoute="updates" {...await readExperienceStorefront()} />;
}
