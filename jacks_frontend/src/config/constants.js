// Centralized configuration - all env-driven values in one place.
// Fallback values are development defaults only.
//
// NOTE: every import.meta.env lookup below must be written out statically.
// Vite substitutes these at build time by matching the literal text
// `import.meta.env.VITE_...`; a dynamic lookup such as import.meta.env[key]
// is left untouched and evaluates to undefined in a production bundle.

// ─── Restaurant Info ────────────────────────────────────────
export const RESTAURANT_NAME =
  import.meta.env.VITE_RESTAURANT_NAME || "Jack's Norwood";
export const RESTAURANT_PHONE =
  import.meta.env.VITE_RESTAURANT_PHONE || "+1 (705) 639-0399";
export const RESTAURANT_EMAIL =
  import.meta.env.VITE_RESTAURANT_EMAIL || "info.jacksnorwood@gmail.com";
export const RESTAURANT_ADDRESS =
  import.meta.env.VITE_RESTAURANT_ADDRESS || "4327 Highway 7, Norwood, ON K0L 2V0";
export const ONLINE_ORDER_URL =
  import.meta.env.VITE_ONLINE_ORDER_URL ||
  "https://www.eastserve.ca/ordering/restaurant/menu?company_uid=8800cce8-d59d-4def-b06e-bd451cf76a1c&restaurant_uid=3d0c5407-0e17-459b-b406-6267a31734d1&facebook=true";

// ─── Google Maps ────────────────────────────────────────────
// Full embed URL from Google Maps → Share → "Embed a map". When it isn't set we
// build a query embed from RESTAURANT_ADDRESS, so the map still points at the
// right place and the address stays the single source of truth.
const CONFIGURED_MAPS_EMBED_URL = import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL || "";

export const GOOGLE_MAPS_EMBED_URL =
  CONFIGURED_MAPS_EMBED_URL ||
  `https://maps.google.com/maps?q=${encodeURIComponent(RESTAURANT_ADDRESS)}&t=m&z=15&output=embed`;

// ─── Opening Hours ──────────────────────────────────────────
// Single source of truth: footer, contact page, reservation sidebar, home page
// and the LocalBusiness structured data all read from here.
//
// Each band reads its own env var (written out statically — see the note above).
// Leave a var unset to use the default; set it to an empty string to hide that
// band entirely, e.g. when the week splits into two groups instead of three.
//
// `schema` is the machine-readable form used for JSON-LD. Keep it in step with
// `time` whenever the hours change.
const HOURS_BANDS = [
  {
    day: "Monday - Thursday",
    time: import.meta.env.VITE_HOURS_MON_THU,
    fallback: "08:00 AM - 08:00 PM",
    schema: { days: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "08:00", closes: "20:00" },
  },
  {
    day: "Friday - Saturday",
    time: import.meta.env.VITE_HOURS_FRI_SAT,
    fallback: "08:00 AM - 10:00 PM",
    schema: { days: ["Friday", "Saturday"], opens: "08:00", closes: "22:00" },
  },
  {
    day: "Sunday",
    time: import.meta.env.VITE_HOURS_SUN,
    fallback: "08:00 AM - 08:00 PM",
    schema: { days: ["Sunday"], opens: "08:00", closes: "20:00" },
  },
];

export const OPENING_HOURS = HOURS_BANDS
  .map(({ day, time, fallback, schema }) => ({
    day,
    time: time === undefined ? fallback : String(time).trim(),
    schema,
  }))
  .filter((band) => band.time !== "");

// ─── Hero image override ────────────────────────────────────
// Used only when no hero images have been uploaded in the admin panel.
// May be an absolute URL or an uploaded "/uploads/..." path — callers pass it
// through resolveImageUrl() so backend-relative paths resolve correctly.
export const HERO_IMAGE_URL = import.meta.env.VITE_HERO_IMAGE_URL || "";

// ─── Fallback / Placeholder Images ─────────────────────────
// Real Unsplash photos that match the pub/restaurant theme.
export const FALLBACK_IMAGE      = "/images/home/popular-fallback.jpg";                                                       // Jack's burger & fries (real photo)
export const FALLBACK_HERO       = "/default-hero.jpeg";                                                                     // Jack's Norwood interior
export const FALLBACK_EVENT      = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&h=600&fit=crop&q=80";   // live music / event
export const FALLBACK_TEAM       = "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop&q=80";    // chef portrait
export const FALLBACK_GALLERY    = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop&q=80";   // restaurant interior
export const FALLBACK_PROMOTION  = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=800&fit=crop&q=80";   // appetising food plating
export const FALLBACK_RESTAURANT = "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800&h=600&fit=crop&q=80";   // pub atmosphere

// ─── Local Storage Keys ────────────────────────────────────
export const LS_TOKEN_KEY = "jn_token";
export const LS_USER_KEY = "jn_user";
