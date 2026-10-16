import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { readExperienceStorefront } from "./storefront-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const { products } = await readExperienceStorefront();
  const routes = ["", "/shop", "/about", "/wholesale"];
  return [
    ...routes.map((route) => ({ url: `${origin}${route}`, changeFrequency: route === "/shop" ? "daily" as const : "monthly" as const, priority: route === "" ? 1 : .8 })),
    ...products.filter((product) => product.active).map((product) => ({ url: `${origin}/products/${product.slug.replace(/^pantry-/, "")}`, changeFrequency: "weekly" as const, priority: .7 })),
  ];
}
