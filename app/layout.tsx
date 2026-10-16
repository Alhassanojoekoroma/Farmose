import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "Farmose Pantry";
  const description = "Farmose: groundnut paste, raw honey, palm oil and spices made in Sierra Leone.";
  return {
    metadataBase: new URL(origin),
    title: { default: title, template: "%s | Farmose" },
    description,
    applicationName: "Farmose",
    icons: { icon: "/farmose/icons/icon-192.png", apple: "/farmose/icons/icon-192.png" },
    manifest: "/farmose/manifest.webmanifest",
    keywords: ["Farmose", "Freetown", "Sierra Leone", "groundnut paste", "raw honey", "palm oil", "spices"],
    openGraph: {
      title,
      description,
      type: "website",
      locale: "en_SL",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "Farmose — Clean local food, ready for your kitchen" }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export const viewport: Viewport = { themeColor: "#14402b", viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
