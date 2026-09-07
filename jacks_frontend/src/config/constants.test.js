import { describe, it, expect, afterEach, vi } from 'vitest';

// Opening-hours resolution is covered in hours.test.js.

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
