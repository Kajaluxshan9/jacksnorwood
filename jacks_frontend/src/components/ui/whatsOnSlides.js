import { FALLBACK_EVENT, FALLBACK_PROMOTION } from '../../config/constants';
import { formatApiDate, formatApiTime } from '../../utils/date';

/**
 * Data shaping for the "What's On" welcome panel.
 *
 * Separate from the component so it can be unit-tested directly, and because a
 * file that exports both a component and helpers breaks React Fast Refresh.
 */
const SESSION_KEY = 'whats_on_popup_shown';
export const OPEN_DELAY_MS = 900;
const MAX_EVENTS = 3;
const MAX_SPECIALS = 2;

/** sessionStorage throws in some privacy modes; never let that break the page. */
export const seenThisSession = () => {
  try {
    return Boolean(sessionStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
};

export const markSeen = () => {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* showing it again next navigation is harmless */
  }
};

/** Collapses events and promotions into one slide shape the panel can render. */
export function buildSlides(events = [], promotions = [], today = new Date()) {
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  const eventSlides = events.slice(0, MAX_EVENTS).map((e) => ({
    kind: 'event',
    key: `event-${e.id}`,
    badge: 'Upcoming Event',
    title: e.title,
    description: e.description,
    imageUrl: e.imageUrl,
    fallback: FALLBACK_EVENT,
    date: e.date ? formatApiDate(e.date, { weekday: 'long', day: 'numeric', month: 'long' }) : '',
    time: formatApiTime(e.time),
    ctaLabel: 'See Event Details',
    to: '/events',
  }));

  // Only today's daily specials, matching what the promotions page calls "Daily".
  const specialSlides = promotions
    .filter((p) => p.promotionType === 'DAILY' && (!p.dayOfWeek || p.dayOfWeek === dayName))
    .slice(0, MAX_SPECIALS)
    .map((p) => ({
      kind: 'special',
      key: `promo-${p.id}`,
      badge: p.dayOfWeek ? `${p.dayOfWeek} Special` : 'Daily Special',
      title: p.title,
      description: p.description,
      imageUrl: p.imageUrl,
      fallback: FALLBACK_PROMOTION,
      date: '',
      time: '',
      ctaLabel: 'View Specials',
      to: '/promotions?type=DAILY',
    }));

  return [...eventSlides, ...specialSlides];
}
