const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const { headers: optHeaders, body: optBody, ...restOptions } = options;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...optHeaders,
    },
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

export function getRecentSearches(token) {
  return request('/recent-searches', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function saveRecentSearchToDB(token, query) {
  return request('/recent-searches', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { query },
  });
}