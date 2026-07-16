import type { Metadata } from "next";
import { FarmoseSite } from "../../components/FarmoseSite";
import { products } from "../../farmose-data";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = products.find((item) => item.slug === slug);
  return {
    title: product?.name ?? "Farmose Product",
    description: product?.description,
  };
}

export default async function ProductRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <FarmoseSite view="product" slug={slug} />;
}
