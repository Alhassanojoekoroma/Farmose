import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FarmoseSite } from "../../components/FarmoseSite";
import { products } from "../../farmose-data";
import { readStorefront } from "../../storefront-server";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await readStorefront();
  const product = storefront.products.find((item) => item.slug === slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const image = new URL(product.image || product.imageUrl || "/images/farmose-groundnut-display.webp", origin).toString();
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description: product.description, type: "website", images: [{ url: image, alt: product.name }] },
    twitter: { card: "summary_large_image", title: product.name, description: product.description, images: [image] },
  };
}

export default async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storefront = await readStorefront();
  const product = storefront.products.find((item) => item.slug === slug);
  if (!product) notFound();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        image: product.image || product.imageUrl || "/images/farmose-groundnut-display.webp",
        description: product.description,
        category: product.category,
        brand: { "@type": "Brand", name: "Farmose" },
        offers: { "@type": "Offer", priceCurrency: "SLE", price: product.price, availability: "https://schema.org/InStock", url: `/products/${product.slug}` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Shop", item: "/shop" },
          { "@type": "ListItem", position: 2, name: product.category, item: `/shop?category=${encodeURIComponent(product.category)}` },
          { "@type": "ListItem", position: 3, name: product.name, item: `/products/${product.slug}` },
        ],
      },
    ],
  };
  return <><FarmoseSite view="product" slug={slug} {...storefront} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></>;
}
