import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";
import { readStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop Clean Local Produce",
  description: "Browse Farmose pantry staples, fresh seafood and local produce in Freetown.",
  alternates: { canonical: "/shop" },
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const storefront = await readStorefront();
  return <FarmoseSite view="shop" category={category} {...storefront} />;
}
