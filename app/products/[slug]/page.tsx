import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { FarmoseExperience } from "../../components/FarmoseExperience";
import { experienceProducts } from "../../farmose-experience-products";
import { readExperienceStorefront } from "../../storefront-server";

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return experienceProducts.map((product) => ({ slug: product.slug.replace(/^pantry-/, "") }));
}

function findProduct<T extends { slug: string }>(products: T[], slug: string) {
  return products.find((product) => product.slug === slug || product.slug === `pantry-${slug}`);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const storefront = await readExperienceStorefront();
  const product = findProduct(storefront.products, slug);
  if (!product) return { title: "Product not found", robots: { index: false, follow: false } };
  const incoming = await headers();
  const host = incoming.get("x-forwarded-host") ?? incoming.get("host") ?? "farmose.local";
  const protocol = incoming.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const image = new URL(product.image, origin).toString();
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: { title: product.name, description: product.description, type: "website", images: [{ url: image, alt: product.name }] },
    twitter: { card: "summary_large_image", title: product.name, description: product.description, images: [image] },
  };
}

export default async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const storefront = await readExperienceStorefront();
  const product = findProduct(storefront.products, slug);
  if (!product) notFound();
  const route = product.slug.replace(/^pantry-/, "");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.image,
    description: product.description,
    category: product.category,
    brand: { "@type": "Brand", name: "Farmose" },
    ...(product.price > 0 ? { offers: { "@type": "Offer", priceCurrency: "SLE", price: product.price, availability: product.active ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `/products/${route}` } } : {}),
  };
  return <><FarmoseExperience initialRoute={route} {...storefront} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></>;
}
