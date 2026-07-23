/**
 * publicAgentController.js
 *
 * Unauthenticated endpoints for the public agents marketplace.
 * Sensitive fields (email, phone, password_hash, audit data) are never exposed.
 *
 * Endpoints:
 *  GET /api/public/agents       — list active agents with filters
 *  GET /api/public/agents/:id   — public agent profile + active packages
 */

const pool = require('../config/db');

const VALID_SPECIALTIES = [
  'Luxury', 'Adventure', 'Cultural', 'Honeymoon',
  'Family', 'Wellness', 'Business', 'Budget',
];


// ═══════════════════════════════════════════════════════════════════════════════
// LIST PUBLIC AGENTS  —  GET /api/public/agents
// ═══════════════════════════════════════════════════════════════════════════════
const listPublicAgents = async (req, res) => {
  const {
    q         = '',
    specialty = '',
    page      = 1,
    limit     = 12,
    sort      = 'name_asc',
  } = req.query;

  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const lim    = Math.min(50, parseInt(limit));

  const allowedSorts = {
    name_asc:      'u.first_name ASC',
    name_desc:     'u.first_name DESC',
    packages_desc: 'total_packages DESC',
    newest:        'u.created_at DESC',
  };
  const orderBy = allowedSorts[sort] || 'u.first_name ASC';

  const conditions = [`u.role_type = 'agent'`, `u.status = 'active'`];
  const params = [];

  if (q) {
    params.push(`%${q.trim()}%`);
    conditions.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR pr.bio ILIKE $${params.length})`);
  }

  if (specialty && VALID_SPECIALTIES.includes(specialty)) {
    params.push(JSON.stringify(specialty));
    conditions.push(`pr.specialties @> $${params.length}::jsonb`);
  }

  const where = conditions.join(' AND ');

  try {
    const countRes = await pool.query(
      `SELECT COUNT(DISTINCT u.id)
       FROM users u
       LEFT JOIN user_profiles pr ON pr.user_id = u.id
       WHERE ${where}`,
      params
    );

    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT
         u.id,
         u.first_name,
         u.last_name,
         pr.bio,
         pr.nationality,
         pr.avatar_url,
         pr.specialties,
         COUNT(ap.id)                                          AS total_packages,
         COUNT(ap.id) FILTER (WHERE ap.status = 'active')     AS active_packages
       FROM users u
       LEFT JOIN user_profiles  pr ON pr.user_id   = u.id
       LEFT JOIN agent_packages ap ON ap.provider_id = pr.id AND ap.provider_type = 'Agent'
       WHERE ${where}
       GROUP BY u.id, pr.id
       ORDER BY ${orderBy}
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      agents: rows,
      total:  parseInt(countRes.rows[0].count),
      page:   parseInt(page),
      limit:  lim,
    });
  } catch (err) {
    console.error('[listPublicAgents] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agents.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET PUBLIC AGENT DETAIL  —  GET /api/public/agents/:id
// ═══════════════════════════════════════════════════════════════════════════════
const getPublicAgentDetail = async (req, res) => {
  const { id } = req.params;

  try {
    // Agent profile (public fields only)
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name,
         pr.bio, pr.nationality, pr.avatar_url, pr.specialties,
         COUNT(ap.id)                                       AS total_packages,
         COUNT(ap.id) FILTER (WHERE ap.status = 'active')  AS active_packages
       FROM users u
       LEFT JOIN user_profiles  pr ON pr.user_id   = u.id
       LEFT JOIN agent_packages ap ON ap.provider_id = pr.id AND ap.provider_type = 'Agent'
       WHERE u.id = $1
         AND u.role_type = 'agent'
         AND u.status    = 'active'
       GROUP BY u.id, pr.id`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    // Active packages only
    const { rows: packages } = await pool.query(
      `SELECT
         ap.id, ap.package_name, ap.destination_name, ap.package_type,
         ap.travel_mode, ap.summary, ap.duration_days, ap.duration_nights,
         ap.base_price AS price_per_person, ap.currency_code AS currency,
         ap.min_travelers, ap.max_travelers, ap.is_customizable
       FROM agent_packages ap
       JOIN user_profiles up ON ap.provider_id = up.id
       WHERE up.user_id = $1
         AND ap.provider_type = 'Agent'
         AND ap.status = 'active'
         AND ap.is_active = true
       ORDER BY ap.base_price ASC`,
      [id]
    );

    return res.json({ agent: rows[0], packages });
  } catch (err) {
    console.error('[getPublicAgentDetail] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agent profile.' });
  }
};


module.exports = { listPublicAgents, getPublicAgentDetail, VALID_SPECIALTIES };
