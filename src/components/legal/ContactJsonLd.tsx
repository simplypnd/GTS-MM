import { getSiteUrl } from "@/lib/seo/siteUrl";

export function ContactJsonLd() {
  const siteUrl = getSiteUrl();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "GTS MM",
    url: siteUrl,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@gtseller.shop",
      availableLanguage: ["English", "Filipino"],
      areaServed: "PH",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
