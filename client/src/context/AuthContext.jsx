/**
 * AuthContext.jsx
 * Global authentication state. Provides:
 *  - user object + accessToken
 *  - login(), googleLogin(), logout() actions
 * Persists token to sessionStorage (access token, short-lived — no localStorage).
 */

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { localLogin, googleAuth, logout as apiLogout } from '../services/authService';

const AuthContext = createContext(null);

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).exp * 1000;
  } catch {
    return null;
  }
}

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

  const clearSession = useCallback((message = null) => {
    setUser(null);
    setAccessToken(null);
    setAuthError(message);
    sessionStorage.removeItem('travelai_user');
    sessionStorage.removeItem('travelai_token');
  }, []);

  // Access tokens expire independently of the refresh cookie. Clear stale UI
  // state exactly when the JWT expires so protected routes return to sign-in.
  useEffect(() => {
    if (!accessToken) return undefined;

    const expiry = getTokenExpiry(accessToken);
    if (!expiry) {
      clearSession('Your session is invalid. Please sign in again.');
      return undefined;
    }

    const remaining = expiry - Date.now();
    if (remaining <= 0) {
      clearSession('Your session has expired. Please sign in again.');
      return undefined;
    }

    const timer = window.setTimeout(() => {
      clearSession('Your session has expired. Please sign in again.');
    }, remaining);

    return () => window.clearTimeout(timer);
  }, [accessToken, clearSession]);

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
      if (data?.user) {
        setUser(data.user);
        sessionStorage.setItem('travelai_user', JSON.stringify(data.user));
      }
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
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
    clearSession();
  }, [clearSession]);

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
