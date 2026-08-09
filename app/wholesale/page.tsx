import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";
import { readStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Wholesale Supply",
  description: "Clean local produce and seafood supply for restaurants, hotels and caterers in Freetown.",
};

export default async function WholesalePage() {
  const storefront = await readStorefront();
  return <FarmoseSite view="wholesale" {...storefront} />;
}
