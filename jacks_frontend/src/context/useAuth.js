import { useContext } from 'react';
import { AuthContext } from './auth-context';

/** Access the current session. Must be called inside <AuthProvider>. */
export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
