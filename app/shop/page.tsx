import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";

export const metadata: Metadata = {
  title: "Shop Clean Local Produce",
  description: "Browse Farmose pantry staples, fresh seafood and local produce in Freetown.",
};

export default function ShopPage() {
  return <FarmoseSite view="shop" />;
}
