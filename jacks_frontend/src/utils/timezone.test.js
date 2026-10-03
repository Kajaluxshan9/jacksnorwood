import { describe, it, expect } from 'vitest';
import {
  restaurantToday,
  restaurantNowLocalISO,
  restaurantWeekday,
  restaurantZoneLabel,
  RESTAURANT_TIME_ZONE,
} from './timezone';

/**
 * These assertions are written against fixed UTC instants, so they hold no
 * matter which timezone the test machine (or CI) is in — which is the whole
 * point of the module.
 */
describe('restaurant clock', () => {
  it('is Canadian Eastern', () => {
    expect(RESTAURANT_TIME_ZONE).toBe('America/Toronto');
  });

  describe('daylight saving is applied from the IANA rules, not hardcoded', () => {
    it('summer instants are EDT, UTC-4', () => {
      // 2026-07-01 02:00 UTC -> 2026-06-30 22:00 in Norwood
      const summer = new Date('2026-07-01T02:00:00Z');
      expect(restaurantNowLocalISO(summer)).toBe('2026-06-30T22:00');
      expect(restaurantZoneLabel(summer)).toBe('EDT');
    });

    it('winter instants are EST, UTC-5', () => {
      // 2026-01-01 02:00 UTC -> 2025-12-31 21:00 in Norwood
      const winter = new Date('2026-01-01T02:00:00Z');
      expect(restaurantNowLocalISO(winter)).toBe('2025-12-31T21:00');
      expect(restaurantZoneLabel(winter)).toBe('EST');
    });

    it('handles the spring-forward changeover', () => {
      // DST begins 2026-03-08 at 02:00 local. 06:30 UTC is 01:30 EST (before),
      // 07:30 UTC is 03:30 EDT (after - 02:xx never exists that day).
      expect(restaurantNowLocalISO(new Date('2026-03-08T06:30:00Z'))).toBe('2026-03-08T01:30');
      expect(restaurantNowLocalISO(new Date('2026-03-08T07:30:00Z'))).toBe('2026-03-08T03:30');
    });

    it('handles the autumn fall-back changeover', () => {
      // DST ends 2026-11-01 at 02:00 local; 01:30 happens twice.
      expect(restaurantNowLocalISO(new Date('2026-11-01T05:30:00Z'))).toBe('2026-11-01T01:30'); // EDT
      expect(restaurantNowLocalISO(new Date('2026-11-01T06:30:00Z'))).toBe('2026-11-01T01:30'); // EST
    });
  });

  describe("'today' follows Norwood, not the viewer", () => {
    it('late evening in Norwood is already tomorrow in UTC', () => {
      // 2026-10-03 01:00 UTC is still 2026-10-02 21:00 in Norwood.
      const instant = new Date('2026-10-03T01:00:00Z');
      expect(restaurantToday(instant)).toBe('2026-10-02');
      expect(instant.toISOString().slice(0, 10)).toBe('2026-10-03'); // what the old code used
    });

    it('a visitor in Sydney sees Norwood\'s weekday, not their own', () => {
      // Sunday 09:00 in Sydney = Saturday 18:00 in Norwood.
      const instant = new Date('2026-10-04T22:00:00Z');
      expect(new Intl.DateTimeFormat('en-US', { timeZone: 'Australia/Sydney', weekday: 'long' }).format(instant))
        .toBe('Monday');
      expect(restaurantWeekday(instant)).toBe('Sunday');
    });

    it('picks the weekday used to match daily specials', () => {
      expect(restaurantWeekday(new Date('2026-10-05T16:00:00Z'))).toBe('Monday');
    });
  });

  it('produces the same shape a datetime-local input uses', () => {
    expect(restaurantNowLocalISO(new Date('2026-10-09T18:00:00Z'))).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('pads single-digit months, days and hours', () => {
    expect(restaurantNowLocalISO(new Date('2026-03-09T13:05:00Z'))).toBe('2026-03-09T09:05');
  });
});
