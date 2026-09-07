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

/** "19:30:00" -> "19:30". */
export function formatApiTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

/**
 * Today as "YYYY-MM-DD" in the *browser's* timezone.
 *
 * Used for the `min` on date inputs. `toISOString().split('T')[0]` was wrong
 * here: it converts to UTC first, so during the evening in Ontario it returned
 * tomorrow's date and blocked same-day bookings.
 */
export function todayLocalISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
