import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * The opening-hours variables were read under names that did not exist in .env
 * (VITE_HOURS_SUN_WED vs VITE_HOURS_MON_THU), so the configured hours were
 * silently ignored everywhere on the site and the hard-coded defaults showed
 * instead. Vite gives no error for that - a name it does not recognise is just
 * left as undefined - so these tests pin the contract.
 */
describe('OPENING_HOURS', () => {
  const load = async () => {
    vi.resetModules();
    return import('./constants.js');
  };

  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reads the same variable names that .env.example documents', async () => {
    vi.stubEnv('VITE_HOURS_MON_THU', '11:00 AM - 10:00 PM');
    vi.stubEnv('VITE_HOURS_FRI_SAT', '11:00 AM - 12:00 AM');
    vi.stubEnv('VITE_HOURS_SUN', '12:00 PM - 9:00 PM');

    const { OPENING_HOURS } = await load();

    expect(OPENING_HOURS.map((b) => b.time)).toEqual([
      '11:00 AM - 10:00 PM',
      '11:00 AM - 12:00 AM',
      '12:00 PM - 9:00 PM',
    ]);
  });

  it('labels each band', async () => {
    const { OPENING_HOURS } = await load();
    expect(OPENING_HOURS.map((b) => b.day)).toEqual([
      'Monday - Thursday',
      'Friday - Saturday',
      'Sunday',
    ]);
  });

  it('falls back to defaults when nothing is configured', async () => {
    const { OPENING_HOURS } = await load();
    expect(OPENING_HOURS).toHaveLength(3);
    OPENING_HOURS.forEach((band) => expect(band.time).not.toBe(''));
  });

  it('hides a band that is explicitly set to an empty value', async () => {
    vi.stubEnv('VITE_HOURS_SUN', '');

    const { OPENING_HOURS } = await load();

    expect(OPENING_HOURS).toHaveLength(2);
    expect(OPENING_HOURS.map((b) => b.day)).not.toContain('Sunday');
  });

  it('carries schema data for the structured-data block', async () => {
    const { OPENING_HOURS } = await load();

    OPENING_HOURS.forEach((band) => {
      expect(band.schema.days.length).toBeGreaterThan(0);
      expect(band.schema.opens).toMatch(/^\d{2}:\d{2}$/);
      expect(band.schema.closes).toMatch(/^\d{2}:\d{2}$/);
    });
    // Every day of the week must be covered exactly once.
    const days = OPENING_HOURS.flatMap((b) => b.schema.days);
    expect(new Set(days).size).toBe(7);
  });
});

describe('GOOGLE_MAPS_EMBED_URL', () => {
  const load = async () => {
    vi.resetModules();
    return import('./constants.js');
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses the configured embed URL when one is set', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_URL', 'https://maps.example/embed?pb=123');

    const { GOOGLE_MAPS_EMBED_URL } = await load();

    expect(GOOGLE_MAPS_EMBED_URL).toBe('https://maps.example/embed?pb=123');
  });

  it('falls back to a map built from the restaurant address', async () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_URL', '');
    vi.stubEnv('VITE_RESTAURANT_ADDRESS', '4327 Highway 7, Norwood, ON K0L 2V0');

    const { GOOGLE_MAPS_EMBED_URL } = await load();

    expect(GOOGLE_MAPS_EMBED_URL).toContain('output=embed');
    expect(GOOGLE_MAPS_EMBED_URL).toContain(encodeURIComponent('4327 Highway 7, Norwood, ON K0L 2V0'));
  });
});
