/**
 * tripService.js
 * API wrapper for trip planning endpoints.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const { headers: optHeaders, body: optBody, ...restOptions } = options;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: { 'Content-Type': 'application/json', ...optHeaders },
    credentials: 'include',
    body: optBody ? JSON.stringify(optBody) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
}

/**
 * planTrip — POST /api/trips/plan
 * @param {string} token — JWT access token
 * @param {{ description: string, instantPlan: boolean }} payload
 */
export function planTrip(token, payload) {
  return request('/trips/plan', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}
