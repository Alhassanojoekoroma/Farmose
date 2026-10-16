import { FarmoseExperience } from "./components/FarmoseExperience";
import { readExperienceStorefront } from "./storefront-server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const storefront = await readExperienceStorefront();
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "/#organization",
        name: "Farmose",
        url: "/",
        logo: storefront.theme.experienceLogoImage,
        description: "Groundnut paste, raw honey, palm oil and spices made in Sierra Leone.",
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
  return <><FarmoseExperience {...storefront} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /></>;
}
