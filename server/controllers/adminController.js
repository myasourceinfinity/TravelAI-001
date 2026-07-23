/**
 * adminController.js
 *
 * Endpoints for platform admins (admin / useradmin / superadmin).
 * All routes are mounted under /api/admin, guarded by authMiddleware
 * + requireRole(...ADMIN_ROLES) in adminRoutes.js.
 *
 * Endpoints:
 *  GET    /api/admin/agents                  — list / search agents
 *  GET    /api/admin/agents/:id              — agent detail + stats
 *  POST   /api/admin/agents                  — provision new agent
 *  PATCH  /api/admin/agents/:id/status       — suspend / activate
 *  PATCH  /api/admin/agents/:id/role         — change role
 *  GET    /api/admin/agents/:id/packages     — agent's packages
 *  GET    /api/admin/audit-logs              — audit log with filters
 *  GET    /api/admin/stats                   — platform analytics
 */

const bcrypt = require('bcrypt');
const pool   = require('../config/db');
const { ELEVATED_ROLES } = require('../middleware/requireRole');
const { writeAuditLog }  = require('../utils/sessionHelper');

const SALT_ROUNDS = 12;

const VALID_STATUSES = ['active', 'suspended', 'pending', 'deleted'];
const VALID_ROLES    = ['traveler', 'agent', 'admin', 'useradmin', 'superadmin', 'support'];


// ═══════════════════════════════════════════════════════════════════════════════
// LIST AGENTS  —  GET /api/admin/agents
// ═══════════════════════════════════════════════════════════════════════════════
const listAgents = async (req, res) => {
  const {
    q        = '',
    status   = 'all',
    page     = 1,
    limit    = 20,
    sort     = 'created_at_desc',
  } = req.query;

  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(100, parseInt(limit));
  const lim    = Math.min(100, parseInt(limit));

  const [sortCol, sortDir] = sort.endsWith('_asc')
    ? [sort.replace('_asc', ''), 'ASC']
    : [sort.replace('_desc', ''), 'DESC'];

  const allowedSorts = { created_at: 'u.created_at', first_name: 'u.first_name', email: 'u.email', last_login_at: 'u.last_login_at' };
  const orderBy = `${allowedSorts[sortCol] || 'u.created_at'} ${sortDir}`;

  const conditions = [`u.role_type = 'agent'`];
  const params = [];

  if (q) {
    params.push(`%${q.trim()}%`);
    conditions.push(`(u.first_name ILIKE $${params.length} OR u.last_name ILIKE $${params.length} OR u.email ILIKE $${params.length})`);
  }
  if (status !== 'all' && VALID_STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`u.status = $${params.length}`);
  }

  const where = conditions.join(' AND ');

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM users u WHERE ${where}`,
      params
    );

    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email, u.phone,
         u.role_type, u.status, u.email_verified,
         u.last_login_at, u.created_at,
         pr.id          AS profile_id,
         pr.bio,
         pr.nationality,
         pr.specialties,
         pr.avatar_url,
         COUNT(ap.id)   AS total_packages,
         COUNT(ap.id) FILTER (WHERE ap.status = 'active') AS active_packages
       FROM users u
       LEFT JOIN user_profiles        pr ON pr.user_id = u.id
       LEFT JOIN agent_packages        ap ON ap.provider_id = pr.id AND ap.provider_type = 'Agent'
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
    console.error('[listAgents] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agents.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET AGENT DETAIL  —  GET /api/admin/agents/:id
// ═══════════════════════════════════════════════════════════════════════════════
const getAgentDetail = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email, u.phone,
         u.role_type, u.status, u.auth_provider, u.email_verified,
         u.last_login_at, u.created_at, u.updated_at,
         pr.id          AS profile_id,
         pr.dob, pr.nationality, pr.bio, pr.avatar_url, pr.specialties,
         COUNT(ap.id)   AS total_packages,
         COUNT(ap.id) FILTER (WHERE ap.status = 'active') AS active_packages,
         COUNT(ap.id) FILTER (WHERE ap.status = 'draft')  AS draft_packages
       FROM users u
       LEFT JOIN user_profiles pr ON pr.user_id  = u.id
       LEFT JOIN agent_packages ap ON ap.provider_id = pr.id AND ap.provider_type = 'Agent'
       WHERE u.id = $1
       GROUP BY u.id, pr.id`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Agent not found.' });

    // Recent audit activity
    const { rows: activity } = await pool.query(
      `SELECT event_type, ip_address, metadata, created_at
       FROM audit_logs
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [id]
    );

    return res.json({ agent: rows[0], recentActivity: activity });
  } catch (err) {
    console.error('[getAgentDetail] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch agent detail.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// CREATE AGENT  —  POST /api/admin/agents
// ═══════════════════════════════════════════════════════════════════════════════
const createAgent = async (req, res) => {
  const {
    first_name, last_name, email, phone,
    password,           // temp password; admin shares with agent out-of-band
    nationality, bio, specialties,
  } = req.body;

  const ip        = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, email, and password are required.' });
  }

  const client = await pool.connect();
  try {
    // Duplicate email check
    const { rows: existing } = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );
    if (existing.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    await client.query('BEGIN');

    // 1. Insert user
    const { rows: userRows } = await client.query(
      `INSERT INTO users
         (first_name, last_name, email, phone, password_hash,
          role_type, status, auth_provider, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'agent', 'active', 'local', TRUE)
       RETURNING id, first_name, last_name, email, role_type, status`,
      [
        first_name.trim(),
        last_name?.trim() || null,
        email.toLowerCase().trim(),
        phone?.trim() || null,
        password_hash,
      ]
    );
    const newUser = userRows[0];

    // 2. Insert user_profiles
    await client.query(
      `INSERT INTO user_profiles (user_id, nationality, bio, specialties)
       VALUES ($1, $2, $3, $4)`,
      [
        newUser.id,
        nationality?.trim() || null,
        bio?.trim()         || null,
        JSON.stringify(Array.isArray(specialties) ? specialties : []),
      ]
    );

    // 3. Insert user_preferences (empty row required for profile joins)
    await client.query(
      `INSERT INTO user_preferences (user_id) VALUES ($1)`,
      [newUser.id]
    );

    // 4. Audit log
    await writeAuditLog(client, {
      userId:    req.user.userId,
      eventType: 'agent_created',
      ip,
      userAgent,
      metadata:  { created_agent_id: newUser.id, email: newUser.email, created_by: req.user.email },
    });

    await client.query('COMMIT');

    return res.status(201).json({
      message:      'Agent account created successfully.',
      agent:        newUser,
      tempPassword: password,   // returned once; admin shares with the agent
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[createAgent] Error:', err.message);
    return res.status(500).json({ error: 'Failed to create agent.' });
  } finally {
    client.release();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE AGENT STATUS  —  PATCH /api/admin/agents/:id/status
// ═══════════════════════════════════════════════════════════════════════════════
const updateAgentStatus = async (req, res) => {
  const { id }     = req.params;
  const { status } = req.body;
  const ip         = req.ip || req.socket?.remoteAddress;
  const userAgent  = req.headers['user-agent'];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}.` });
  }

  // Self-lockout guard
  if (id === req.user.userId) {
    return res.status(400).json({ error: 'You cannot change your own account status.' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name, email, role_type, status`,
      [status, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    await writeAuditLog(client, {
      userId:    req.user.userId,
      eventType: 'agent_status_changed',
      ip,
      userAgent,
      metadata:  { target_user_id: id, new_status: status, changed_by: req.user.email },
    });

    return res.json({ message: `Status updated to "${status}".`, user: rows[0] });
  } catch (err) {
    console.error('[updateAgentStatus] Error:', err.message);
    return res.status(500).json({ error: 'Failed to update status.' });
  } finally {
    client.release();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE AGENT ROLE  —  PATCH /api/admin/agents/:id/role
// ═══════════════════════════════════════════════════════════════════════════════
const updateAgentRole = async (req, res) => {
  const { id }        = req.params;
  const { role_type } = req.body;
  const ip            = req.ip || req.socket?.remoteAddress;
  const userAgent     = req.headers['user-agent'];

  if (!VALID_ROLES.includes(role_type)) {
    return res.status(400).json({ error: `Invalid role. Must be one of: ${VALID_ROLES.join(', ')}.` });
  }

  // Self-demote guard
  if (id === req.user.userId) {
    return res.status(400).json({ error: 'You cannot change your own role.' });
  }

  // Privilege-escalation guard: only superadmin may assign elevated roles
  if (ELEVATED_ROLES.includes(role_type) && req.user.role_type !== 'superadmin') {
    return res.status(403).json({ error: 'Only superadmin can assign admin-level roles.' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users SET role_type = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, first_name, email, role_type, status`,
      [role_type, id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    await writeAuditLog(client, {
      userId:    req.user.userId,
      eventType: 'agent_role_changed',
      ip,
      userAgent,
      metadata:  { target_user_id: id, new_role: role_type, changed_by: req.user.email },
    });

    return res.json({ message: `Role updated to "${role_type}".`, user: rows[0] });
  } catch (err) {
    console.error('[updateAgentRole] Error:', err.message);
    return res.status(500).json({ error: 'Failed to update role.' });
  } finally {
    client.release();
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET AGENT PACKAGES  —  GET /api/admin/agents/:id/packages
// ═══════════════════════════════════════════════════════════════════════════════
const getAgentPackages = async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT
         ap.id, ap.package_name, ap.destination_name, ap.package_type,
         ap.travel_mode, ap.summary, ap.duration_days, ap.duration_nights,
         ap.base_price AS price_per_person, ap.currency_code AS currency,
         ap.status, ap.is_active, ap.min_travelers, ap.max_travelers,
         ap.is_customizable, ap.created_at,
         COUNT(apc.id) AS component_count
       FROM agent_packages ap
       JOIN user_profiles up ON ap.provider_id = up.id
       LEFT JOIN agent_package_components apc ON apc.package_id = ap.id
       WHERE up.user_id = $1 AND ap.provider_type = 'Agent'
       GROUP BY ap.id
       ORDER BY ap.created_at DESC`,
      [id]
    );

    return res.json({ packages: rows });
  } catch (err) {
    console.error('[getAgentPackages] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch packages.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET AUDIT LOGS  —  GET /api/admin/audit-logs
// ═══════════════════════════════════════════════════════════════════════════════
const getAuditLogs = async (req, res) => {
  const {
    user_id,
    event_type,
    from,
    to,
    page  = 1,
    limit = 50,
  } = req.query;

  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(200, parseInt(limit));
  const lim    = Math.min(200, parseInt(limit));

  const conditions = [];
  const params     = [];

  if (user_id) {
    params.push(user_id);
    conditions.push(`al.user_id = $${params.length}`);
  }
  if (event_type) {
    params.push(event_type);
    conditions.push(`al.event_type = $${params.length}`);
  }
  if (from) {
    params.push(from);
    conditions.push(`al.created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`al.created_at <= $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM audit_logs al ${where}`,
      params
    );

    params.push(lim, offset);
    const { rows } = await pool.query(
      `SELECT
         al.id, al.user_id, al.event_type, al.ip_address,
         al.metadata, al.created_at,
         u.first_name, u.last_name, u.email
       FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       ${where}
       ORDER BY al.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    return res.json({
      logs:  rows,
      total: parseInt(countRes.rows[0].count),
      page:  parseInt(page),
      limit: lim,
    });
  } catch (err) {
    console.error('[getAuditLogs] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch audit logs.' });
  }
};


// ═══════════════════════════════════════════════════════════════════════════════
// GET STATS  —  GET /api/admin/stats
// ═══════════════════════════════════════════════════════════════════════════════
const getStats = async (req, res) => {
  try {
    const [agentStats, packageStats, recentSignups, recentLogins] = await Promise.all([
      // Agent counts by status
      pool.query(
        `SELECT status, COUNT(*) AS count
         FROM users WHERE role_type = 'agent'
         GROUP BY status`
      ),
      // Package counts
      pool.query(
        `SELECT
           COUNT(*)                                              AS total_packages,
           COUNT(*) FILTER (WHERE status = 'active')            AS active_packages,
           COUNT(*) FILTER (WHERE status = 'draft')             AS draft_packages,
           COUNT(*) FILTER (WHERE status = 'archived')          AS archived_packages,
           COUNT(DISTINCT provider_id)                          AS agents_with_packages
         FROM agent_packages
         WHERE provider_type = 'Agent'`
      ),
      // New agent signups in last 30 days (by day)
      pool.query(
        `SELECT DATE(created_at) AS day, COUNT(*) AS count
         FROM users
         WHERE role_type = 'agent'
           AND created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day
         ORDER BY day ASC`
      ),
      // Recent logins (last 7 days)
      pool.query(
        `SELECT COUNT(*) AS count
         FROM audit_logs
         WHERE event_type = 'login_success'
           AND created_at >= NOW() - INTERVAL '7 days'`
      ),
    ]);

    // Pivot agent status counts into an object
    const agentsByStatus = {};
    for (const row of agentStats.rows) {
      agentsByStatus[row.status] = parseInt(row.count);
    }

    return res.json({
      agents: {
        byStatus: agentsByStatus,
        total:    Object.values(agentsByStatus).reduce((a, b) => a + b, 0),
      },
      packages:        packageStats.rows[0],
      signupTrend:     recentSignups.rows,
      loginsLast7Days: parseInt(recentLogins.rows[0]?.count || 0),
    });
  } catch (err) {
    console.error('[getStats] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch stats.' });
  }
};


module.exports = {
  listAgents,
  getAgentDetail,
  createAgent,
  updateAgentStatus,
  updateAgentRole,
  getAgentPackages,
  getAuditLogs,
  getStats,
};
