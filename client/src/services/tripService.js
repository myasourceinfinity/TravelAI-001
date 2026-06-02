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

/**
 * saveTripToDB — POST /api/trips/save
 * @param {string} token — JWT access token
 * @param {{ plan: object, title?: string }} payload
 */
export function saveTripToDB(token, payload) {
  return request('/trips/save', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}

/**
 * getSavedTrips — GET /api/trips
 * @param {string} token — JWT access token
 */
export function getSavedTrips(token) {
  return request('/trips', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * modifyTrip — PUT /api/trips/:id
 *
 * Partial update — only the fields you pass are changed.
 * To replace destinations entirely, include the full `destinations` array.
 *
 * @param {string} token — JWT access token
 * @param {number|string} tripId — ID of the trip to update
 * @param {{
 *   title?:        string,
 *   summary?:      string,
 *   days?:         number,
 *   travelers?:    number,
 *   budgetLevel?:  'budget' | 'moderate' | 'luxury',
 *   suggestions?:  object[],
 *   destinations?: object[],
 * }} updates — fields to update (at least one required)
 * @returns {Promise<{ message: string, trip: object }>}
 */
export function modifyTrip(token, tripId, updates) {
  return request(`/trips/${tripId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: updates,
  });
}

/**
 * deleteTrip — DELETE /api/trips/:id
 * @param {string} token — JWT access token
 * @param {string} tripId — ID of the trip to delete
 */
export function deleteTrip(token, tripId) {
  return request(`/trips/${tripId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}
