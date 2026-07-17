import type { Metadata } from "next";
import { FarmoseSite } from "../components/FarmoseSite";

export const metadata: Metadata = {
  title: "Our Story & Contact",
  description: "Learn about the Farmose clean-food standard and visit our Hill Station store in Freetown.",
};

export default function AboutPage() {
  return <FarmoseSite view="about" />;
}
