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
  title = "Black Ritual Records - Dark Music for Dark Souls",
  description = "Discover the darkest depths of metal, black metal, and gothic music. Vinyl, CDs, cassettes, and rare releases from the underground's most sinister artists.",
  keywords = "black metal, death metal, gothic, vinyl records, underground music, dark music, metal albums, rare releases, Black Ritual Records",
  image = "/og-image.jpg",
  url = "https://blackplaguerecords.com",
  type = "website",
  structuredData
}: SEOHeadProps) => {
  const fullTitle = title.includes("Black Ritual Records") ? title : `${title} | Black Ritual Records`;
  
  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "MusicStore",
    "name": "Black Ritual Records",
    "description": description,
    "url": url,
    "logo": `${url}/logo.png`,
    "sameAs": [
      "https://facebook.com/blackplaguerecords",
      "https://instagram.com/blackplaguerecords",
      "https://twitter.com/blackplaguerecords"
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
      <meta name="author" content="Black Ritual Records" />
      <link rel="canonical" href={url} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Black Ritual Records" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:site" content="@blackplaguerecords" />
      <meta name="twitter:creator" content="@blackplaguerecords" />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#0F0F0F" />
      <meta name="msapplication-TileColor" content="#0F0F0F" />
      <meta name="application-name" content="Black Ritual Records" />
      <meta name="apple-mobile-web-app-title" content="Black Ritual Records" />
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