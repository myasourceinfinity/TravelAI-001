/**
 * agentService.js
 * API wrapper for public /api/public/agents/* endpoints.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const { body, headers, ...restOptions } = options;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data.error || data.message || 'Request failed');
    err.status = res.status;
    throw err;
  }

  return data;
}

export function listPublicAgents({ q = '', specialty = '', page = 1, limit = 12, sort = 'name_asc' } = {}) {
  const params = new URLSearchParams();

  if (q) params.set('q', q);
  if (specialty) params.set('specialty', specialty);

  params.set('page', page);
  params.set('limit', limit);
  params.set('sort', sort);

  return request(`/public/agents?${params}`, { method: 'GET' });
}

export function getPublicAgentDetail(id) {
  return request(`/public/agents/${id}`, { method: 'GET' });
}

export function submitAgentReview(id, token, { rating, comment }) {
  return request(`/public/agents/${id}/reviews`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      rating,
      comment,
    },
  });
}