import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Farmose | Clean Local Food in Freetown";
  const description = "Shop premium, pre-cleaned local produce, seafood and pantry staples from Farmose in Freetown, Sierra Leone.";
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: "%s | Farmose" },
    description,
    applicationName: "Farmose",
    icons: { icon: "/favicon.png", shortcut: "/favicon.png" },
    keywords: ["Farmose", "Freetown groceries", "Sierra Leone local produce", "clean seafood", "groundnut paste"],
    openGraph: {
      title: "Farmose — Good food starts clean",
      description: "Premium local produce, meticulously cleaned and ready for your kitchen.",
      type: "website",
      locale: "en_SL",
      images: [{ url: `${origin}/og.webp`, width: 1200, height: 630, alt: "Farmose — Good food starts clean" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Farmose — Good food starts clean",
      description: "Clean local produce, ready for real life.",
      images: [`${origin}/og.webp`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
