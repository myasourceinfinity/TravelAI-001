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
    err.details = data.details;
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
 * chatWithAI — POST /api/trips/chat
 * @param {string} token — JWT access token
 * @param {{ messages: object[] }} payload
 */
export function chatWithAI(token, payload) {
  return request('/trips/chat', {
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

export function getAgentPackages(token) {
  return request('/packages/my', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * confirmBooking — POST /api/trips/booking/confirm
 *
 * Creates a confirmed internal reservation (status: 'pending_payment') for the
 * traveller's selected flights/hotels/activities. This is the step BEFORE
 * payment — Stripe checkout is the next feature, which will transition the
 * booking from 'pending_payment' to 'confirmed'.
 *
 * @param {string} token — JWT access token
 * @param {{
 *   tripId?:             string,
 *   destination:         string,
 *   originCity:           string,
 *   departDate:           string,  // YYYY-MM-DD
 *   returnDate?:          string,  // YYYY-MM-DD
 *   travelers:            number,
 *   selectedComponents:   object[],
 *   totalPricePerPerson:  number,
 *   totalPriceAll:        number,
 *   travelerName:         string,
 *   travelerEmail:        string,
 *   travelerPhone?:       string,
 * }} payload
 * @returns {Promise<{ success: boolean, booking: object, message: string }>}
 */
export function confirmBooking(token, payload) {
  return request('/trips/booking/confirm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}

/**
 * getBooking — GET /api/trips/booking/:id
 * @param {string} token — JWT access token
 * @param {string} bookingId
 */
export function getBooking(token, bookingId) {
  return request(`/trips/booking/${bookingId}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function createSinglePackage(token, packageData) {
  return request('/packages/single', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: packageData,
  });
}

export async function validateBulkPackages(token, file, overwrite = false, targetProviderId = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('overwrite', overwrite ? 'true' : 'false');
  if (targetProviderId) formData.append('overrideProviderId', String(targetProviderId));

  const res = await fetch(`${BASE_URL}/packages/bulk/validate`, {
    method: 'POST',
    headers: { 
      Authorization: `Bearer ${token}`
    },
    body: formData,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Bulk validation failed');
    err.details = data.details;
    throw err;
  }
  return data;
}

export function confirmBulkPackages(token, packages, overwrite = false) {
  return request('/packages/bulk/confirm', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { packages, overwrite },
  });
}

export function updateSinglePackage(token, packageId, packageData) {
  return request(`/packages/${packageId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: packageData,
  });
}

/**
 * getUserBookings — GET /api/trips/bookings
 * @param {string} token — JWT access token
 */
export function getUserBookings(token) {
  return request('/trips/bookings', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

