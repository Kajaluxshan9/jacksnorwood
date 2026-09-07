import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

/**
 * Session handling in the axios layer.
 *
 * Two things were wrong before: only 401 was treated as an expired session
 * (Spring Security answered 403, so the admin was left on a dead page), and the
 * redirect also fired on the login page itself, reloading it and wiping the
 * "Invalid username or password" toast before it could be read.
 */
describe('api response interceptor', () => {
  let api;
  let rejectHandler;

  const loadApi = async () => {
    vi.resetModules();

    // Capture the rejection handler axios would have registered.
    vi.doMock('axios', () => {
      const instance = {
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn((_ok, err) => { rejectHandler = err; }) },
        },
        get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
      };
      return { default: { create: vi.fn(() => instance) } };
    });

    const mod = await import('./api.js');
    api = mod;
    return mod;
  };

  const fail = (status, url = '/reservations') =>
    rejectHandler({ response: { status }, config: { url } }).catch(() => {});

  // jsdom treats any assignment to window.location as a real navigation and
  // logs "Not implemented". Swap in a plain object so the redirect is
  // observable instead of noisy.
  const setLocation = (pathname) => {
    const stub = { pathname, href: pathname, assign: vi.fn() };
    Object.defineProperty(window, 'location', {
      configurable: true, writable: true, value: stub,
    });
    return stub;
  };

  beforeEach(async () => {
    localStorage.clear();
    setLocation('/admin/menu');
    await loadApi();
  });

  afterEach(() => {
    vi.doUnmock('axios');
    vi.resetModules();
    localStorage.clear();
  });

  it('sends the admin back to the login page when the session dies', async () => {
    const location = setLocation('/admin/menu');
    localStorage.setItem('jn_token', 'stale');

    await fail(401);

    expect(location.href).toBe('/admin/login');
  });

  it('never reloads the login page itself', async () => {
    // The reload is what used to destroy the "Invalid username or password"
    // toast before anyone could read it.
    const location = setLocation('/admin/login');
    localStorage.setItem('jn_token', 'stale');

    await fail(401);

    expect(location.href).toBe('/admin/login');
    expect(location.href).not.toContain('/admin/login/');
  });

  it('does not redirect away from a public page', async () => {
    const location = setLocation('/menu');
    localStorage.setItem('jn_token', 'stale');

    await fail(401);

    expect(location.href).toBe('/menu');
  });

  it('clears the session on 401', async () => {
    localStorage.setItem('jn_token', 'stale');
    localStorage.setItem('jn_user', '{}');

    await fail(401);

    expect(localStorage.getItem('jn_token')).toBeNull();
    expect(localStorage.getItem('jn_user')).toBeNull();
  });

  it('also clears the session on 403 when a token was present', async () => {
    // Older backends answered 403 for an expired token.
    localStorage.setItem('jn_token', 'stale');
    localStorage.setItem('jn_user', '{}');

    await fail(403);

    expect(localStorage.getItem('jn_token')).toBeNull();
  });

  it('ignores a 403 when there was no token to begin with', async () => {
    const logout = vi.fn();
    api.setLogoutHandler(logout);

    await fail(403);

    expect(logout).not.toHaveBeenCalled();
  });

  it('does not treat a failed sign-in as an expired session', async () => {
    const logout = vi.fn();
    api.setLogoutHandler(logout);
    localStorage.setItem('jn_token', 'stale');

    await fail(401, '/auth/login');

    expect(logout).not.toHaveBeenCalled();
    expect(localStorage.getItem('jn_token')).toBe('stale');
  });

  it('leaves other failures alone', async () => {
    localStorage.setItem('jn_token', 'good');

    await fail(500);
    await fail(404);
    await fail(400);

    expect(localStorage.getItem('jn_token')).toBe('good');
  });

  it('calls the registered logout handler instead of only wiping storage', async () => {
    const logout = vi.fn();
    api.setLogoutHandler(logout);
    localStorage.setItem('jn_token', 'stale');

    await fail(401);

    expect(logout).toHaveBeenCalledTimes(1);
  });
});

describe('apiErrorMessage', () => {
  let apiErrorMessage;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('axios', () => ({
      default: {
        create: () => ({
          interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
        }),
      },
    }));
    ({ apiErrorMessage } = await import('./api.js'));
  });

  afterEach(() => {
    vi.doUnmock('axios');
    vi.resetModules();
  });

  it('prefers the message the backend supplied', () => {
    const error = { response: { data: { message: 'Please choose a date that is not in the past' } } };
    expect(apiErrorMessage(error)).toBe('Please choose a date that is not in the past');
  });

  it('falls back to an "error" field', () => {
    expect(apiErrorMessage({ response: { data: { error: 'File type not allowed' } } }))
      .toBe('File type not allowed');
  });

  it('uses the caller fallback when the response carries nothing useful', () => {
    expect(apiErrorMessage({}, 'Failed to save item')).toBe('Failed to save item');
    expect(apiErrorMessage(undefined, 'Failed to save item')).toBe('Failed to save item');
    expect(apiErrorMessage({ response: { data: {} } }, 'Failed to save item'))
      .toBe('Failed to save item');
  });
});

describe('resolveImageUrl', () => {
  let resolveImageUrl;

  beforeEach(async () => {
    vi.resetModules();
    vi.doMock('axios', () => ({
      default: {
        create: () => ({
          interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
        }),
      },
    }));
    ({ resolveImageUrl } = await import('./api.js'));
  });

  afterEach(() => {
    vi.doUnmock('axios');
    vi.resetModules();
  });

  it('leaves absolute URLs untouched', () => {
    expect(resolveImageUrl('https://images.example/x.jpg')).toBe('https://images.example/x.jpg');
  });

  it('resolves an uploaded path against the API host, not the site origin', () => {
    // A raw "/uploads/..." would be requested from the frontend origin and 404.
    expect(resolveImageUrl('/uploads/abc.jpg')).toMatch(/\/uploads\/abc\.jpg$/);
    expect(resolveImageUrl('/uploads/abc.jpg')).not.toBe('/uploads/abc.jpg');
  });

  it('returns the fallback for an empty value', () => {
    expect(resolveImageUrl('', '/default-hero.jpeg')).toBe('/default-hero.jpeg');
    expect(resolveImageUrl(null, '/default-hero.jpeg')).toBe('/default-hero.jpeg');
    expect(resolveImageUrl(undefined)).toBe('');
  });
});
