/**
 * Opening hours configuration.
 *
 * Two naming schemes exist in the wild for these variables:
 *
 *   - `VITE_HOURS_SUN_WED` / `VITE_HOURS_THU_SAT` — the two-band scheme the
 *     production deployment has always used, matching the pub's real schedule
 *     (Sunday–Wednesday and Thursday–Saturday).
 *   - `VITE_HOURS_MON_THU` / `VITE_HOURS_FRI_SAT` / `VITE_HOURS_SUN` — a
 *     three-band scheme used by some local setups.
 *
 * Both are supported. Whichever scheme a deployment sets wins; if neither is
 * set the two-band default applies, because that is what the site has always
 * displayed. Getting this wrong puts incorrect opening hours in front of
 * customers, so the resolution is explicit rather than implied.
 *
 * Every lookup below is written out in full: Vite substitutes
 * `import.meta.env.VITE_*` by matching the literal text at build time, so a
 * computed key is left as `undefined` in the bundle.
 */

const SUN_WED = import.meta.env.VITE_HOURS_SUN_WED;
const THU_SAT = import.meta.env.VITE_HOURS_THU_SAT;

const MON_THU = import.meta.env.VITE_HOURS_MON_THU;
const FRI_SAT = import.meta.env.VITE_HOURS_FRI_SAT;
const SUN = import.meta.env.VITE_HOURS_SUN;

/** Schema.org day names, so the JSON-LD block stays in step with the display text. */
const DAYS = {
  SUN_WED: ['Sunday', 'Monday', 'Tuesday', 'Wednesday'],
  THU_SAT: ['Thursday', 'Friday', 'Saturday'],
  MON_THU: ['Monday', 'Tuesday', 'Wednesday', 'Thursday'],
  FRI_SAT: ['Friday', 'Saturday'],
  SUN: ['Sunday'],
};

/** "08:00 AM - 08:00 PM" -> { opens: "08:00", closes: "20:00" } for structured data. */
export function toSchemaTimes(range) {
  const match = String(range || '').match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)?\s*-\s*(\d{1,2}):(\d{2})\s*(AM|PM)?/i,
  );
  if (!match) return null;

  const to24 = (hour, minute, meridiem) => {
    let h = parseInt(hour, 10);
    const m = (meridiem || '').toUpperCase();
    if (m === 'PM' && h !== 12) h += 12;
    if (m === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${minute}`;
  };

  return {
    opens: to24(match[1], match[2], match[3]),
    closes: to24(match[4], match[5], match[6]),
  };
}

const band = (day, time, days) => {
  const times = toSchemaTimes(time);
  return { day, time, schema: times ? { days, ...times } : null };
};

function resolveBands() {
  // The two-band names win when present. They are what the production
  // deployment sets, so a machine that happens to define both schemes resolves
  // to the schedule customers actually see rather than a developer's local one.
  const usesTwoBand = SUN_WED !== undefined || THU_SAT !== undefined;
  const usesThreeBand =
    MON_THU !== undefined || FRI_SAT !== undefined || SUN !== undefined;

  if (usesThreeBand && !usesTwoBand) {
    return [
      band('Monday - Thursday', MON_THU ?? '08:00 AM - 08:00 PM', DAYS.MON_THU),
      band('Friday - Saturday', FRI_SAT ?? '08:00 AM - 10:00 PM', DAYS.FRI_SAT),
      band('Sunday', SUN ?? '08:00 AM - 08:00 PM', DAYS.SUN),
    ];
  }

  // Default / production shape.
  return [
    band('Sunday - Wednesday', SUN_WED ?? '08:00 AM - 08:00 PM', DAYS.SUN_WED),
    band('Thursday - Saturday', THU_SAT ?? '08:00 AM - 10:00 PM', DAYS.THU_SAT),
  ];
}

/**
 * The bands shown in the footer, contact page, reservation sidebar, home page
 * and the LocalBusiness structured data. A band set to an empty value is
 * hidden, so a deployment can drop one it does not need.
 */
export const OPENING_HOURS = resolveBands()
  .map((b) => ({ ...b, time: String(b.time).trim() }))
  .filter((b) => b.time !== '');
