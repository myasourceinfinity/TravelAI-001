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
         COUNT(DISTINCT ap.id)                                      AS total_packages,
         COUNT(DISTINCT ap.id) FILTER (WHERE ap.status = 'active') AS active_packages,
         COALESCE(rv.average_rating, 0)                            AS average_rating,
         COALESCE(rv.review_count, 0)                              AS review_count
       FROM users u
       LEFT JOIN user_profiles  pr ON pr.user_id   = u.id
       LEFT JOIN agent_packages ap ON ap.provider_id = pr.id AND ap.provider_type = 'Agent'
       LEFT JOIN LATERAL (
          SELECT
            ROUND(AVG(ar.rating)::numeric, 1) AS average_rating,
            COUNT(*)::int AS review_count
          FROM agent_reviews ar
          WHERE ar.agent_id = u.id
        ) rv ON true
       WHERE ${where}
       GROUP BY u.id, pr.id, rv.average_rating, rv.review_count
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
         u.id,
         u.first_name,
         u.last_name,
         pr.bio,
         pr.nationality,
         pr.avatar_url,
         pr.specialties,
         COUNT(DISTINCT ap.id)                                      AS total_packages,
         COUNT(DISTINCT ap.id) FILTER (WHERE ap.status = 'active') AS active_packages,
         COALESCE(rv.average_rating, 0)                            AS average_rating,
         COALESCE(rv.review_count, 0)                              AS review_count
       FROM users u
       LEFT JOIN user_profiles pr
         ON pr.user_id = u.id
       LEFT JOIN agent_packages ap
         ON ap.provider_id = pr.id
        AND ap.provider_type = 'Agent'
       LEFT JOIN LATERAL (
         SELECT
           ROUND(AVG(ar.rating)::numeric, 1) AS average_rating,
           COUNT(*)::int AS review_count
         FROM agent_reviews ar
         WHERE ar.agent_id = u.id
       ) rv ON true
       WHERE u.id = $1
         AND u.role_type = 'agent'
         AND u.status = 'active'
       GROUP BY u.id, pr.id, rv.average_rating, rv.review_count`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    // Active packages only
    const { rows: packages } = await pool.query(
      `SELECT
         ap.id,
         ap.package_name,
         ap.destination_name,
         ap.package_type,
         ap.travel_mode,
         ap.summary,
         ap.duration_days,
         ap.duration_nights,
         ap.base_price AS price_per_person,
         ap.currency_code AS currency,
         ap.min_travelers,
         ap.max_travelers,
         ap.is_customizable
       FROM agent_packages ap
       JOIN user_profiles up
         ON ap.provider_id = up.id
       WHERE up.user_id = $1
         AND ap.provider_type = 'Agent'
         AND ap.status = 'active'
         AND ap.is_active = true
       ORDER BY ap.base_price ASC`,
      [id]
    );

    const { rows: reviews } = await pool.query(
      `SELECT
         ar.id,
         ar.rating,
         ar.comment,
         ar.created_at,
         ar.updated_at,
         u.first_name,
         u.last_name
       FROM agent_reviews ar
       JOIN users u
         ON u.id = ar.reviewer_id
       WHERE ar.agent_id = $1
       ORDER BY ar.updated_at DESC
       LIMIT 20`,
      [id]
    );

    return res.json({
      agent: rows[0],
      packages,
      reviews,
    });
  } catch (err) {
    console.error('[getPublicAgentDetail] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agent profile.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE / UPDATE AGENT REVIEW — POST /api/public/agents/:id/reviews
// ═══════════════════════════════════════════════════════════════════════════════
const createAgentReview = async (req, res) => {
  const { id } = req.params;
  const reviewerId = req.user?.userId || req.user?.id;
  const rating = Number(req.body.rating);
  const comment = String(req.body.comment || '').trim();

  if (!reviewerId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
  }

  if (comment.length > 1000) {
    return res.status(400).json({ error: 'Review comment must be 1000 characters or less.' });
  }

  if (id === reviewerId) {
    return res.status(400).json({ error: 'You cannot review yourself.' });
  }

  try {
    const agentCheck = await pool.query(
      `SELECT id
       FROM users
       WHERE id = $1
         AND role_type = 'agent'
         AND status = 'active'`,
      [id]
    );

    if (agentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Agent not found.' });
    }

    const reviewerCheck = await pool.query(
      `SELECT id, role_type, status
       FROM users
       WHERE id = $1
         AND status = 'active'`,
      [reviewerId]
    );

    if (reviewerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Reviewer account is not active.' });
    }

    const reviewerRole = reviewerCheck.rows[0].role_type;

    if (['agent', 'admin', 'useradmin', 'superadmin'].includes(reviewerRole)) {
      return res.status(403).json({ error: 'Only travellers can review agents.' });
    }

    const { rows: reviewRows } = await pool.query(
      `INSERT INTO agent_reviews (
         agent_id,
         reviewer_id,
         rating,
         comment
       )
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (agent_id, reviewer_id)
       DO UPDATE SET
         rating = EXCLUDED.rating,
         comment = EXCLUDED.comment,
         updated_at = NOW()
       RETURNING id, agent_id, reviewer_id, rating, comment, created_at, updated_at`,
      [id, reviewerId, rating, comment || null]
    );

    const { rows: summaryRows } = await pool.query(
      `SELECT
         COALESCE(ROUND(AVG(rating)::numeric, 1), 0) AS average_rating,
         COUNT(*)::int AS review_count
       FROM agent_reviews
       WHERE agent_id = $1`,
      [id]
    );

    const { rows: reviews } = await pool.query(
      `SELECT
         ar.id,
         ar.rating,
         ar.comment,
         ar.created_at,
         ar.updated_at,
         u.first_name,
         u.last_name
       FROM agent_reviews ar
       JOIN users u ON u.id = ar.reviewer_id
       WHERE ar.agent_id = $1
       ORDER BY ar.updated_at DESC
       LIMIT 20`,
      [id]
    );

    return res.status(201).json({
      review: reviewRows[0],
      reviewSummary: summaryRows[0],
      reviews,
    });
  } catch (err) {
    console.error('[createAgentReview] Error:', err.message);
    return res.status(500).json({ error: 'Failed to submit review.' });
  }
};

module.exports = {
  listPublicAgents,
  getPublicAgentDetail,
  createAgentReview,
  VALID_SPECIALTIES,
};
