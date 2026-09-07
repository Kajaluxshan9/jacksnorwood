import { Helmet } from 'react-helmet-async';
import {
  RESTAURANT_NAME,
  RESTAURANT_PHONE,
  RESTAURANT_EMAIL,
  RESTAURANT_ADDRESS,
  OPENING_HOURS,
} from '../../config/constants';

// Structured data for search engines.
//
// Name, phone, email and opening hours are read from the shared config rather
// than repeated here. They used to be hard-coded, which made this a third
// source of truth for the hours — so the machine-readable version silently
// drifted from the site the moment anyone changed them.

/** "+1 (705) 639-0399" -> "+17056390399" (schema.org wants the dialable form). */
const telephone = RESTAURANT_PHONE.replace(/[^+\d]/g, '');

/** "4327 Highway 7, Norwood, ON K0L 2V0" -> its PostalAddress parts. */
function parseAddress(value) {
  const parts = value.split(',').map((p) => p.trim());
  const [streetAddress = '', addressLocality = '', region = ''] = parts;
  // Trailing segment is "ON K0L 2V0": province, then the postal code.
  const regionMatch = region.match(/^([A-Za-z]{2})\s+(.*)$/);
  return {
    '@type': 'PostalAddress',
    streetAddress,
    addressLocality,
    addressRegion: regionMatch ? regionMatch[1].toUpperCase() : region,
    postalCode: regionMatch ? regionMatch[2] : '',
    addressCountry: 'CA',
  };
}

const schema = {
  '@context': 'https://schema.org',
  '@type': 'BarOrPub',
  name: RESTAURANT_NAME,
  url: 'https://www.jacksnorwoodpub.ca',
  telephone,
  email: RESTAURANT_EMAIL,
  address: parseAddress(RESTAURANT_ADDRESS),
  openingHoursSpecification: OPENING_HOURS.filter((band) => band.schema).map((band) => ({
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: band.schema.days,
    opens: band.schema.opens,
    closes: band.schema.closes,
  })),
  servesCuisine: ['Canadian', 'Pub Food'],
  priceRange: '$$',
  image: 'https://www.jacksnorwoodpub.ca/default-hero.jpeg',
  menu: 'https://www.jacksnorwoodpub.ca/menu',
  hasMap: 'https://maps.app.goo.gl/8rM4wakJKRFojbtRA',
  currenciesAccepted: 'CAD',
  paymentAccepted: 'Cash, Credit Card, Debit Card',
};

export default function LocalBusinessSchema() {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
