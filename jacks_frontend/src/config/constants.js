// Centralized configuration - all env-driven values in one place.
// Fallback values are development defaults only.

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

// ─── Opening Hours ──────────────────────────────────────────
export const OPENING_HOURS = [
  {
    day: "Sunday - Wednesday",
    time: import.meta.env.VITE_HOURS_SUN_WED || "08:00 AM - 08:00 PM",
  },
  {
    day: "Thursday - Saturday",
    time: import.meta.env.VITE_HOURS_THU_SAT || "08:00 AM - 10:00 PM",
  },
];

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
