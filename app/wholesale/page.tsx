import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";

export const metadata: Metadata = {
  title: "Wholesale Supply",
  description: "Clean local produce and seafood supply for restaurants, hotels and caterers in Freetown.",
};

export default function WholesalePage() {
  return <FarmoseSite view="wholesale" />;
}
