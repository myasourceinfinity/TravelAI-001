/**
 * authService.js
 * Thin API wrapper for all authentication endpoints.
 * Base URL is set via VITE_API_BASE_URL in client/.env
 */

// Use relative /api path so Vite proxy forwards to Express (avoids CORS).
// Only use the full absolute URL if explicitly overridden in .env.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    credentials: 'include',   // send/receive HttpOnly cookies
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.status = res.status;
    err.detail = data.detail || null;
    throw err;
  }

  return data;
}

/**
 * localSignup — POST /api/auth/signup
 * @param {object} payload  — combined Phase 1 + Phase 2 form data
 */
export function localSignup(payload) {
  return request('/auth/signup', { method: 'POST', body: payload });
}

/**
 * localLogin — POST /api/auth/login
 * @param {{ email: string, password: string }} payload
 */
export function localLogin(payload) {
  return request('/auth/login', { method: 'POST', body: payload });
}

/**
 * googleAuth — POST /api/auth/google
 * @param {{ credential: string }} payload  — raw Google JWT
 */
export function googleAuth(payload) {
  return request('/auth/google', { method: 'POST', body: payload });
}

/**
 * logout — POST /api/auth/logout
 */
export function logout() {
  return request('/auth/logout', { method: 'POST' });
}

/**
 * forgotPassword — POST /api/auth/forgot-password
 * @param {{ email: string }} payload
 */
export function forgotPassword(payload) {
  return request('/auth/forgot-password', { method: 'POST', body: payload });
}

/**
 * resetPassword — POST /api/auth/reset-password
 * @param {{ token: string, password: string }} payload
 */
export function resetPassword(payload) {
  return request('/auth/reset-password', { method: 'POST', body: payload });
}
