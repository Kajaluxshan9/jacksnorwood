import { createContext } from 'react';

/**
 * Auth context object.
 *
 * Split out from AuthContext.jsx (the provider) and useAuth.js (the hook) so
 * that each module has a single kind of export. A file that exports both a
 * component and a plain value breaks React Fast Refresh, which then falls back
 * to a full page reload on every edit during development.
 */
export const AuthContext = createContext(null);
