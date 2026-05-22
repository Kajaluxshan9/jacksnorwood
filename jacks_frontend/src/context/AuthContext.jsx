import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { setLogoutHandler } from '../services/api';

const AuthContext = createContext(null);

/** Decode a JWT payload without a library. Returns null if malformed. */
function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/** Returns true if the token is present, well-formed, and not expired. */
function isTokenValid(token) {
  if (!token) return false;
  const payload = decodeJwt(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  // exp is in seconds; give a 10-second leeway
  return payload.exp * 1000 > Date.now() + 10_000;
}

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [token, setToken]     = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('jn_token');
    localStorage.removeItem('jn_user');
  }, []);

  // Register logout with the axios layer so 401s can trigger a proper state reset
  useEffect(() => {
    setLogoutHandler(logout);
  }, [logout]);

  // On mount: restore session only if the stored token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem('jn_token');
    const storedUser  = localStorage.getItem('jn_user');

    if (storedToken && storedUser && isTokenValid(storedToken)) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    } else if (storedToken || storedUser) {
      // Stale / expired — clear immediately
      localStorage.removeItem('jn_token');
      localStorage.removeItem('jn_user');
    }
    setLoading(false);
  }, []);

  // Proactive expiry check — poll every minute and auto-logout when token expires
  useEffect(() => {
    if (!token) return;

    const payload = decodeJwt(token);
    if (!payload?.exp) return;

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) { logout(); return; }

    // Fire exactly when the token expires (capped at ~24h to avoid overflow)
    const timer = setTimeout(logout, Math.min(msUntilExpiry, 86_400_000));
    return () => clearTimeout(timer);
  }, [token, logout]);

  const login = (authData) => {
    const newToken = authData.token;
    const newUser  = { username: authData.username, role: authData.role };
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('jn_token', newToken);
    localStorage.setItem('jn_user', JSON.stringify(newUser));
  };

  const isAdmin = () => user?.role === 'ADMIN';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
