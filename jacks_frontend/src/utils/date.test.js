import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatApiDate, formatApiTime, todayLocalISO } from './date';

/**
 * The backend sends plain calendar values ("2026-01-05", "19:30:00").
 * Handing those straight to `new Date()` parses them as UTC, which renders the
 * previous day for every viewer west of Greenwich - Ontario included.
 */
describe('formatApiDate', () => {
  it('keeps the calendar date the backend sent', () => {
    // Compared against a locally-constructed date so the assertion holds in
    // whatever timezone the test happens to run in.
    const expected = new Date(2026, 0, 5).toLocaleDateString('en-CA', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    expect(formatApiDate('2026-01-05')).toBe(expected);
  });

  it('does not shift the day, unlike new Date(string)', () => {
    const viaHelper = formatApiDate('2026-01-05', { day: 'numeric' });
    const local = new Date(2026, 0, 5).toLocaleDateString('en-CA', { day: 'numeric' });
    expect(viaHelper).toBe(local);
    expect(viaHelper).toBe('5');
  });

  it('tolerates a full timestamp by using only the date part', () => {
    expect(formatApiDate('2026-01-05T00:00:00')).toBe(formatApiDate('2026-01-05'));
  });

  it('accepts a custom format', () => {
    expect(formatApiDate('2026-03-09', { day: 'numeric', month: 'short', year: 'numeric' }))
      .toBe(new Date(2026, 2, 9).toLocaleDateString('en-CA', {
        day: 'numeric', month: 'short', year: 'numeric',
      }));
  });

  it('returns an empty string for missing or malformed input', () => {
    expect(formatApiDate(null)).toBe('');
    expect(formatApiDate(undefined)).toBe('');
    expect(formatApiDate('')).toBe('');
    expect(formatApiDate('not-a-date')).toBe('');
  });
});

describe('formatApiTime', () => {
  it('trims seconds off a LocalTime', () => {
    expect(formatApiTime('19:30:00')).toBe('19:30');
    expect(formatApiTime('09:05:00')).toBe('09:05');
  });

  it('leaves an already-short time alone', () => {
    expect(formatApiTime('19:30')).toBe('19:30');
  });

  it('returns an empty string for missing input', () => {
    expect(formatApiTime(null)).toBe('');
    expect(formatApiTime('')).toBe('');
  });
});

describe('todayLocalISO', () => {
  afterEach(() => vi.useRealTimers());

  it('reports the local calendar date, not the UTC one', () => {
    // 21:00 on 5 Jan in Toronto (UTC-5) is already 02:00 on 6 Jan UTC.
    // toISOString() would return the 6th and block same-day bookings.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 0, 5, 21, 0, 0));

    expect(todayLocalISO()).toBe('2026-01-05');
  });

  it('zero-pads month and day', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 2, 9, 12, 0, 0));

    expect(todayLocalISO()).toBe('2026-03-09');
  });

  it('round-trips through formatApiDate', () => {
    expect(formatApiDate(todayLocalISO())).not.toBe('');
  });
});
