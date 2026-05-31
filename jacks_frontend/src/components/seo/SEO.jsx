import { Helmet } from 'react-helmet-async';

const SITE_NAME = "Jack's Norwood";
const BASE_URL = 'https://www.jacksnorwoodpub.ca';
const DEFAULT_OG_IMAGE = `${BASE_URL}/default-hero.jpeg`;

// title: short page name only — the component appends "| Jack's Norwood" automatically.
// Leave title undefined on the home page so the full brand title is used as-is.
export default function SEO({
  title,
  description,
  canonical,
  ogImage = DEFAULT_OG_IMAGE,
  ogImageAlt = "Jack's Norwood Pub & Restaurant in Norwood, Ontario",
  ogType = 'website',
  noindex = false,
}) {
  const fullTitle = title
    ? `${title} | ${SITE_NAME}`
    : `${SITE_NAME} | Pub & Restaurant in Norwood, Ontario`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={`${BASE_URL}${canonical}`} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {canonical && <meta property="og:url" content={`${BASE_URL}${canonical}`} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={ogImageAlt} />
      <meta property="og:locale" content="en_CA" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
