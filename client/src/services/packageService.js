/**
 * packageService.js
 * API wrapper for public /api/public/packages endpoints.
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

export function listPublicPackages({ destination = '', agent = '', costType = '', page = 1, limit = 12, sort = 'price_asc' } = {}) {
  const params = new URLSearchParams();

  if (destination) params.set('destination', destination);
  if (agent) params.set('agent', agent);
  if (costType) params.set('costType', costType);

  params.set('page', page);
  params.set('limit', limit);
  params.set('sort', sort);

  return request(`/public/packages?${params}`, { method: 'GET' });
}

export function getPublicPackageDetail(id) {
  return request(`/public/packages/${id}`, { method: 'GET' });
}
