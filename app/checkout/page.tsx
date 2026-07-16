import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your Farmose order for delivery or pickup in Freetown.",
};

export default function CheckoutPage() {
  return <FarmoseSite view="checkout" />;
}
