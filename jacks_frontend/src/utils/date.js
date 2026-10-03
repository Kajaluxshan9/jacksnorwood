/**
 * Date helpers for API values.
 *
 * The backend sends plain calendar values: "2026-01-05" for a date and
 * "19:30:00" for a time. Passing the date straight to `new Date()` parses it as
 * UTC midnight, so anywhere west of Greenwich it renders as the *previous* day.
 * These helpers build the Date from its parts instead, which keeps it local.
 */

/** "2026-01-05" -> Date at local midnight, or null. */
function parseApiDate(value) {
  if (!value) return null;
  const [datePart] = String(value).split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

/** Long form, e.g. "Monday, 5 January 2026". */
export function formatApiDate(value, options) {
  const date = parseApiDate(value);
  if (!date) return "";
  return date.toLocaleDateString(
    "en-CA",
    options || { weekday: "long", day: "numeric", month: "long", year: "numeric" },
  );
}

/**
 * "2026-10-12T17:00:00" -> "Oct 12, 2026, 5:00 p.m."
 *
 * The backend sends LocalDateTime with no zone, meaning restaurant wall clock.
 * Handing that to `new Date()` parses it in the *viewer's* zone; the digits
 * survive today only because it is then formatted back in that same zone. The
 * moment the API emits a trailing "Z" or an offset, every one of those readings
 * shifts by hours with nothing failing. Reading the parts directly removes that
 * dependence entirely.
 */
export function formatApiDateTime(value, options) {
  if (!value) return "";
  const [datePart, timePart = "00:00"] = String(value).split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0] = timePart.split(":").map(Number);
  if (!y || !m || !d) return "";
  return new Date(y, m - 1, d, hh, mm).toLocaleString(
    "en-CA",
    options || { dateStyle: "medium", timeStyle: "short" },
  );
}

/** "19:30:00" -> "19:30". 24-hour; fine for admin screens. */
export function formatApiTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

/**
 * "19:30:00" -> "7:30 PM", and "14:00:00" -> "2:00 PM".
 *
 * Use this anywhere a customer reads the time. The 24-hour form is not how
 * opening times are written in Canada and reads as a typo on a pub website.
 */
export function formatApiTime12(value) {
  if (!value) return "";
  const [h, m] = String(value).split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "";
  const meridiem = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${meridiem}`;
}
