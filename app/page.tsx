import { FarmoseSite } from "./components/FarmoseSite";
import { readStorefront } from "./storefront-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const storefront = await readStorefront();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "/#organization",
        name: "Farmose",
        url: "/",
        logo: "/images/farmose-logo.png",
        description: "Clean local food and agricultural supply in Freetown, Sierra Leone.",
        address: {
          "@type": "PostalAddress",
          streetAddress: storefront.theme.storeAddress,
          addressLocality: "Freetown",
          addressCountry: "SL",
        },
      },
      {
        "@type": "WebSite",
        "@id": "/#website",
        url: "/",
        name: "Farmose",
        publisher: { "@id": "/#organization" },
      },
    ],
  };
  return <><FarmoseSite view="home" {...storefront} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></>;
}
