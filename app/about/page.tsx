import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";
import { readStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Our Story & Contact",
  description: "Learn about the Farmose clean-food standard and visit our Hill Station store in Freetown.",
  alternates: { canonical: "/about" },
};

export default async function AboutPage() {
  const storefront = await readStorefront();
  return <FarmoseSite view="about" {...storefront} />;
}
