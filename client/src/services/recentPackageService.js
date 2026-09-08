const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

async function request(endpoint, options = {}) {
  const { headers, body, ...restOptions } = options;

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

export function getRecentPackages(token) {
  return request('/recent-packages', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getAgentEnquiries(token) {
  return request('/recent-packages/agent', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function saveRecentPackageActivity(token, { packageId, activityType = 'enquire', offerPrice = null, preferredContactMethod = null, enquiryQuestion = null }) {
  return request('/recent-packages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      packageId,
      activityType,
      offerPrice,
      preferredContactMethod,
      enquiryQuestion,
    },
  });
}

export function addEnquiryFollowUp(token, activityId, { noteType, noteText }) {
  return request(`/recent-packages/enquiries/${activityId}/follow-ups`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { noteType, noteText },
  });
}