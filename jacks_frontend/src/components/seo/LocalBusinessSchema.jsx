import { Helmet } from 'react-helmet-async';

const schema = {
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  "name": "Jack's Norwood",
  "url": "https://www.jacksnorwoodpub.ca",
  "telephone": "+17056390399",
  "email": "info.jacksnorwood@gmail.com",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "4327 Highway 7",
    "addressLocality": "Norwood",
    "addressRegion": "ON",
    "postalCode": "K0L 2V0",
    "addressCountry": "CA"
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Sunday", "Monday", "Tuesday", "Wednesday"],
      "opens": "08:00",
      "closes": "20:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Thursday", "Friday", "Saturday"],
      "opens": "08:00",
      "closes": "22:00"
    }
  ],
  "servesCuisine": ["Canadian", "Pub Food"],
  "priceRange": "$$",
  "image": "https://www.jacksnorwoodpub.ca/default-hero.jpeg",
  "menu": "https://www.jacksnorwoodpub.ca/menu",
  "hasMap": "https://maps.app.goo.gl/8rM4wakJKRFojbtRA",
  "foundingDate": "2026",
  "currenciesAccepted": "CAD",
  "paymentAccepted": "Cash, Credit Card, Debit Card"
};

export default function LocalBusinessSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
