/**
 * agentService.js
 * API wrapper for public /api/public/agents/* endpoints.
 * No authentication required.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    credentials: 'include',
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
 * listPublicAgents
 * @param {{ q?, specialty?, page?, limit?, sort? }} filters
 */
export function listPublicAgents({ q = '', specialty = '', page = 1, limit = 12, sort = 'name_asc' } = {}) {
  const params = new URLSearchParams();
  if (q)         params.set('q', q);
  if (specialty) params.set('specialty', specialty);
  params.set('page', page);
  params.set('limit', limit);
  params.set('sort', sort);
  return request(`/public/agents?${params}`, { method: 'GET' });
}

/**
 * getPublicAgentDetail
 * @param {string} id — agent user UUID
 */
export function getPublicAgentDetail(id) {
  return request(`/public/agents/${id}`, { method: 'GET' });
}
