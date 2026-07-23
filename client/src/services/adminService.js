/**
 * adminService.js
 * API wrapper for all /api/admin/* endpoints.
 * Every call requires a valid admin JWT access token.
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
    err.status  = res.status;
    err.details = data.details || null;
    throw err;
  }

  return data;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export function getAdminStats(token) {
  return request('/admin/stats', {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Agents list ───────────────────────────────────────────────────────────────
export function listAdminAgents(token, { q = '', status = 'all', page = 1, limit = 20, sort = 'created_at_desc' } = {}) {
  const params = new URLSearchParams({ q, status, page, limit, sort });
  return request(`/admin/agents?${params}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Agent detail ──────────────────────────────────────────────────────────────
export function getAdminAgentDetail(token, id) {
  return request(`/admin/agents/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Create agent ──────────────────────────────────────────────────────────────
export function createAdminAgent(token, payload) {
  return request('/admin/agents', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}

// ── Update status ─────────────────────────────────────────────────────────────
export function updateAgentStatus(token, id, status) {
  return request(`/admin/agents/${id}/status`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { status },
  });
}

// ── Update role ───────────────────────────────────────────────────────────────
export function updateAgentRole(token, id, role_type) {
  return request(`/admin/agents/${id}/role`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: { role_type },
  });
}

// ── Agent packages ────────────────────────────────────────────────────────────
export function getAdminAgentPackages(token, id) {
  return request(`/admin/agents/${id}/packages`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Audit logs ────────────────────────────────────────────────────────────────
export function getAuditLogs(token, { user_id = '', event_type = '', from = '', to = '', page = 1, limit = 50 } = {}) {
  const params = new URLSearchParams();
  if (user_id)    params.set('user_id', user_id);
  if (event_type) params.set('event_type', event_type);
  if (from)       params.set('from', from);
  if (to)         params.set('to', to);
  params.set('page', page);
  params.set('limit', limit);
  return request(`/admin/audit-logs?${params}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
}
