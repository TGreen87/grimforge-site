import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  structuredData?: object;
}

const SEOHead = ({
  title = "Obsidian Rite Records | Independent Black Metal Label and Store",
  description = "Independent label and store for underground black metal. Discover artists, releases, and limited runs.",
  keywords = "black metal, death metal, gothic, vinyl records, underground music, dark music, metal albums, rare releases, Obsidian Rite Records",
  image = "/og-image.jpg",
  url = '',
  type = "website",
  structuredData
}: SEOHeadProps) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL_STAGING || url;
  const canonicalUrl = url || siteUrl;
  const fullTitle = title.includes("Obsidian Rite Records") ? title : `${title} | Obsidian Rite Records`;
  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "MusicStore",
    "name": "Obsidian Rite Records",
    "description": description,
    "url": siteUrl,
    "logo": `${siteUrl}/logo.png`,
    "sameAs": [
      "https://www.facebook.com/scruffylikestoast",
      "https://www.instagram.com/obsidianriterecords/"
    ],
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    },
    "paymentAccepted": "Credit Card, PayPal",
    "currenciesAccepted": "USD",
    "priceRange": "$10-$200"
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="author" content="Obsidian Rite Records" />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image.startsWith('http') ? image : `${siteUrl}${image}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Obsidian Rite Records" />
      <meta property="og:locale" content="en_US" />


      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0F0F0F" />
      <meta name="msapplication-TileColor" content="#0F0F0F" />
      <meta name="application-name" content="Obsidian Rite Records" />
      <meta name="apple-mobile-web-app-title" content="Obsidian Rite Records" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
    </Helmet>
  );
};

export default SEOHead;
