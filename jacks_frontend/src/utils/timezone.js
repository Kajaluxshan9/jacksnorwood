/**
 * The restaurant's clock.
 *
 * Jack's is in Norwood, Ontario, so every date and time this site shows or
 * accepts means Canadian Eastern time — regardless of where the visitor or the
 * admin happens to be sitting. An event set to "6pm" is 6pm in Norwood whether
 * it was typed in Toronto or Colombo.
 *
 * Everything here goes through Intl with an explicit `timeZone`, which applies
 * the IANA rules for the date in question. That means DST is handled on its
 * own: EDT (UTC-4) in summer, EST (UTC-5) in winter, including the changeover
 * weekends, with no table to maintain.
 *
 * Why this file exists: the browser's own clock was being used to answer
 * "what day is it?" and "is this in the past?". For a visitor in Sydney, or an
 * admin working from another country, that is a different day from Norwood's.
 */

export const RESTAURANT_TIME_ZONE = 'America/Toronto';

/** Short label for the UI, correct for the season, e.g. "EDT" or "EST". */
export function restaurantZoneLabel(date = new Date()) {
  const part = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT_TIME_ZONE,
    timeZoneName: 'short',
  })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName');
  return part ? part.value : 'ET';
}

/**
 * The wall-clock reading in Norwood right now, as plain numbers.
 * `hourCycle: 'h23'` avoids the "24" that some engines emit at midnight.
 */
function restaurantParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: RESTAURANT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const get = (type) => parts.find((p) => p.type === type)?.value ?? '00';
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

/** Today's calendar date in Norwood, as "YYYY-MM-DD". */
export function restaurantToday(date = new Date()) {
  const { year, month, day } = restaurantParts(date);
  return `${year}-${month}-${day}`;
}

/**
 * Now in Norwood as "YYYY-MM-DDTHH:mm".
 *
 * This is the form a <input type="datetime-local"> produces, so the two can be
 * compared as strings. Comparing those inputs against `new Date().toISOString()`
 * — which is UTC — was silently wrong by the size of the offset.
 */
export function restaurantNowLocalISO(date = new Date()) {
  const { year, month, day, hour, minute } = restaurantParts(date);
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/** The weekday in Norwood, e.g. "Monday" — used to pick today's daily special. */
export function restaurantWeekday(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIME_ZONE,
    weekday: 'long',
  }).format(date);
}
