import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";
import { readStorefront } from "../storefront-server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Farmose order for delivery or pickup in Freetown.",
};

export default async function CheckoutPage() {
  const storefront = await readStorefront();
  return <FarmoseSite view="checkout" {...storefront} />;
}
