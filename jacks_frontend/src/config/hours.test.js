import { describe, it, expect, afterEach, vi } from 'vitest';

/**
 * Opening hours are the one piece of config where being wrong actively misleads
 * customers, so both naming schemes are pinned here.
 *
 * The production deployment sets VITE_HOURS_SUN_WED / VITE_HOURS_THU_SAT and
 * has done since launch. An earlier refactor read only the three-band names,
 * which would have silently dropped the configured values and displayed a
 * different weekly schedule than the pub actually keeps.
 */
const ALL = [
  'VITE_HOURS_SUN_WED', 'VITE_HOURS_THU_SAT',
  'VITE_HOURS_MON_THU', 'VITE_HOURS_FRI_SAT', 'VITE_HOURS_SUN',
];

/**
 * Load with a known-empty environment.
 *
 * The developer's own .env defines the three-band variables, and Vite injects
 * those into the test run too - so without clearing them first these tests
 * would assert against whatever happens to be on the machine.
 */
const load = async (env = {}) => {
  vi.resetModules();
  ALL.forEach((k) => vi.stubEnv(k, undefined));
  Object.entries(env).forEach(([k, v]) => vi.stubEnv(k, v));
  return import('./hours.js');
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('two-band scheme (what production uses)', () => {
  it('reads VITE_HOURS_SUN_WED / VITE_HOURS_THU_SAT', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_SUN_WED: '08:00 AM - 08:00 PM',
      VITE_HOURS_THU_SAT: '08:00 AM - 10:00 PM',
    });

    expect(OPENING_HOURS).toEqual([
      expect.objectContaining({ day: 'Sunday - Wednesday', time: '08:00 AM - 08:00 PM' }),
      expect.objectContaining({ day: 'Thursday - Saturday', time: '08:00 AM - 10:00 PM' }),
    ]);
  });

  it('covers all seven days exactly once', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_SUN_WED: '08:00 AM - 08:00 PM',
      VITE_HOURS_THU_SAT: '08:00 AM - 10:00 PM',
    });
    const days = OPENING_HOURS.flatMap((b) => b.schema.days);

    expect(days).toHaveLength(7);
    expect(new Set(days).size).toBe(7);
  });

  it('puts Thursday in the late band, not the early one', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_SUN_WED: '08:00 AM - 08:00 PM',
      VITE_HOURS_THU_SAT: '08:00 AM - 10:00 PM',
    });
    const late = OPENING_HOURS.find((b) => b.schema.closes === '22:00');

    expect(late.schema.days).toContain('Thursday');
    expect(OPENING_HOURS.find((b) => b.schema.closes === '20:00').schema.days)
      .not.toContain('Thursday');
  });
});

describe('three-band scheme', () => {
  it('is used when those variables are set', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_MON_THU: '11:00 AM - 10:00 PM',
      VITE_HOURS_FRI_SAT: '11:00 AM - 12:00 AM',
      VITE_HOURS_SUN: '12:00 PM - 9:00 PM',
    });

    expect(OPENING_HOURS.map((b) => [b.day, b.time])).toEqual([
      ['Monday - Thursday', '11:00 AM - 10:00 PM'],
      ['Friday - Saturday', '11:00 AM - 12:00 AM'],
      ['Sunday', '12:00 PM - 9:00 PM'],
    ]);
  });

  it('still covers all seven days', async () => {
    const { OPENING_HOURS } = await load({ VITE_HOURS_MON_THU: '11:00 AM - 10:00 PM' });
    const days = OPENING_HOURS.flatMap((b) => b.schema.days);
    expect(new Set(days).size).toBe(7);
  });
});

describe('precedence', () => {
  it('production two-band config wins even if three-band names are also present', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_SUN_WED: '08:00 AM - 08:00 PM',
      VITE_HOURS_THU_SAT: '08:00 AM - 10:00 PM',
      VITE_HOURS_MON_THU: '11:00 AM - 10:00 PM',
    });

    expect(OPENING_HOURS.map((b) => b.day))
      .toEqual(['Sunday - Wednesday', 'Thursday - Saturday']);
  });
});

describe('defaults and hiding', () => {
  it('falls back to the two-band shape the site has always shown', async () => {
    const { OPENING_HOURS } = await load();
    expect(OPENING_HOURS.map((b) => b.day))
      .toEqual(['Sunday - Wednesday', 'Thursday - Saturday']);
  });

  it('hides a band explicitly set to empty', async () => {
    const { OPENING_HOURS } = await load({
      VITE_HOURS_SUN_WED: '08:00 AM - 08:00 PM',
      VITE_HOURS_THU_SAT: '',
    });

    expect(OPENING_HOURS).toHaveLength(1);
  });
});

describe('toSchemaTimes', () => {
  it('converts 12-hour ranges to 24-hour for structured data', async () => {
    const { toSchemaTimes } = await load();
    expect(toSchemaTimes('08:00 AM - 08:00 PM')).toEqual({ opens: '08:00', closes: '20:00' });
    expect(toSchemaTimes('11:00 AM - 12:00 AM')).toEqual({ opens: '11:00', closes: '00:00' });
    expect(toSchemaTimes('12:00 PM - 9:00 PM')).toEqual({ opens: '12:00', closes: '21:00' });
  });

  it('returns null for something it cannot parse', async () => {
    const { toSchemaTimes } = await load();
    expect(toSchemaTimes('Closed')).toBeNull();
    expect(toSchemaTimes('')).toBeNull();
    expect(toSchemaTimes(undefined)).toBeNull();
  });
});
