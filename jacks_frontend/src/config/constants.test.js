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

describe('HERO_IMAGE_URL', () => {
  const load = async (value) => {
    vi.resetModules();
    vi.stubEnv('VITE_HERO_IMAGE_URL', value);
    return import('./constants.js');
  };

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('ignores the Windows file path that was sitting in production', async () => {
    // Only consulted when no hero image is active, and the hero is a CSS
    // background-image with no onError hook - so a bad value here means a blank
    // hero rather than a fallback.
    const { HERO_IMAGE_URL } = await load(
      'jacks_frontend' + String.fromCharCode(92) + 'src' + String.fromCharCode(92) + 'default-hero.jpeg',
    );
    expect(HERO_IMAGE_URL).toBe('');
  });

  it('accepts an uploaded path', async () => {
    const { HERO_IMAGE_URL } = await load('/uploads/abc123.jpeg');
    expect(HERO_IMAGE_URL).toBe('/uploads/abc123.jpeg');
  });

  it('accepts an absolute URL', async () => {
    const { HERO_IMAGE_URL } = await load('https://images.example/hero.jpg');
    expect(HERO_IMAGE_URL).toBe('https://images.example/hero.jpg');
  });

  it('ignores a bare relative filename', async () => {
    const { HERO_IMAGE_URL } = await load('hero.jpg');
    expect(HERO_IMAGE_URL).toBe('');
  });

  it('is empty when unset', async () => {
    const { HERO_IMAGE_URL } = await load('');
    expect(HERO_IMAGE_URL).toBe('');
  });
});
