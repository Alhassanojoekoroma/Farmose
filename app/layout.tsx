import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Farmose | Clean Local Food in Freetown";
  const description = "Shop clean local produce, seafood, meat and pantry staples from Farmose in Freetown, with home delivery, pickup and bulk ordering.";
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: "%s | Farmose" },
    description,
    applicationName: "Farmose",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    keywords: ["Farmose", "Freetown groceries", "Sierra Leone local produce", "clean seafood", "groundnut paste"],
    openGraph: {
      title: "Farmose — Clean local food, ready for your kitchen",
      description,
      type: "website",
      locale: "en_SL",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Farmose — Clean local food, ready for your kitchen" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Farmose — Clean local food, ready for your kitchen",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
