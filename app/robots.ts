import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  return { rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/checkout", "/api/"] }], sitemap: `${origin}/sitemap.xml`, host: origin };
}
