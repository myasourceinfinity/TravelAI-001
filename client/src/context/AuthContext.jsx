/**
 * AuthContext.jsx
 * Global authentication state. Provides:
 *  - user object + accessToken
 *  - login(), googleLogin(), logout() actions
 * Persists token to sessionStorage (access token, short-lived — no localStorage).
 */

import { createContext, useContext, useState, useCallback } from 'react';
import { localLogin, googleAuth, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const[user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem('travelai_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const[accessToken, setAccessToken] = useState(() => {
    return sessionStorage.getItem('travelai_token') || null;
  });

  const [isLoading,   setIsLoading]   = useState(false);
  const [authError,   setAuthError]   = useState(null);

  // ── Local login ─────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await localLogin({ email, password });
      setUser(data.user);
      setAccessToken(data.accessToken);
      
      sessionStorage.setItem('travelai_user', JSON.stringify(data.user));
      sessionStorage.setItem('travelai_token', data.accessToken);
      return data.user;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Google login ─────────────────────────────────────────────────────────────
  const loginWithGoogle = useCallback(async (credential) => {
    setIsLoading(true);
    setAuthError(null);
    try {
      const data = await googleAuth({ credential });
      if (data.accessToken) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        sessionStorage.setItem('travelai_user', JSON.stringify(data.user));
        sessionStorage.setItem('travelai_token', data.accessToken);
      }
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await apiLogout(); } catch (_) { /* silent */ }
    setUser(null);
    setAccessToken(null);
    setAuthError(null);
    sessionStorage.removeItem('travelai_user');
    sessionStorage.removeItem('travelai_token');
  }, []);

  return (
    <AuthContext.Provider value={{
      user, accessToken, isLoading, authError,
      login, loginWithGoogle, logout,
      clearError: () => setAuthError(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
