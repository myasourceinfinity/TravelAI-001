const pool = require('../config/db');

function getAuthUserId(req) {
  return req.user?.userId || req.user?.id;
}

const listRecentPackages = async (req, res) => {
  const userId = getAuthUserId(req);

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const { rows } = await pool.query(
      `SELECT
         rpa.id,
         rpa.activity_type,
         rpa.interaction_count,
         rpa.last_interacted_at,
         ap.id AS package_id,
         ap.package_name,
         ap.destination_name,
         ap.package_type,
         ap.travel_mode,
         ap.duration_days,
         ap.duration_nights,
         ap.base_price,
         ap.currency_code,
         ap.status,
         ap.is_active,
         u.id AS agent_user_id,
         u.first_name AS agent_first_name,
         u.last_name AS agent_last_name
       FROM recent_package_activity rpa
       JOIN agent_packages ap
         ON ap.id = rpa.package_id
       LEFT JOIN user_profiles up
         ON up.id = ap.provider_id
       LEFT JOIN users u
         ON u.id = up.user_id
       WHERE rpa.user_id = $1
         AND ap.provider_type = 'Agent'
       ORDER BY rpa.last_interacted_at DESC
       LIMIT 5`,
      [userId]
    );

    return res.json({ recentPackages: rows });
  } catch (err) {
    console.error('[listRecentPackages] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch recent packages.' });
  }
};

const saveRecentPackageActivity = async (req, res) => {
  const userId = getAuthUserId(req);
  const packageId = Number(req.body.packageId);
  const activityType = req.body.activityType || 'enquire';

  if (!userId) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (!Number.isInteger(packageId) || packageId <= 0) {
    return res.status(400).json({ error: 'Valid packageId is required.' });
  }

  if (!['view', 'enquire'].includes(activityType)) {
    return res.status(400).json({ error: 'Invalid activity type.' });
  }

  try {
    const userCheck = await pool.query(
      `SELECT role_type, status
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].status !== 'active') {
      return res.status(403).json({ error: 'User account is not active.' });
    }

    if (['agent', 'admin', 'useradmin', 'superadmin'].includes(userCheck.rows[0].role_type)) {
      return res.status(403).json({ error: 'Only travellers can save recent package activity.' });
    }

    const packageCheck = await pool.query(
      `SELECT id
       FROM agent_packages
       WHERE id = $1
         AND provider_type = 'Agent'`,
      [packageId]
    );

    if (packageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Package not found.' });
    }

    await pool.query(
      `INSERT INTO recent_package_activity (
         user_id,
         package_id,
         activity_type
       )
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, package_id)
       DO UPDATE SET
         activity_type = EXCLUDED.activity_type,
         interaction_count = recent_package_activity.interaction_count + 1,
         last_interacted_at = NOW()`,
      [userId, packageId, activityType]
    );

    const { rows } = await pool.query(
      `SELECT
         rpa.id,
         rpa.activity_type,
         rpa.interaction_count,
         rpa.last_interacted_at,
         ap.id AS package_id,
         ap.package_name,
         ap.destination_name,
         ap.package_type,
         ap.travel_mode,
         ap.duration_days,
         ap.duration_nights,
         ap.base_price,
         ap.currency_code,
         u.id AS agent_user_id,
         u.first_name AS agent_first_name,
         u.last_name AS agent_last_name
       FROM recent_package_activity rpa
       JOIN agent_packages ap
         ON ap.id = rpa.package_id
       LEFT JOIN user_profiles up
         ON up.id = ap.provider_id
       LEFT JOIN users u
         ON u.id = up.user_id
       WHERE rpa.user_id = $1
       ORDER BY rpa.last_interacted_at DESC
       LIMIT 5`,
      [userId]
    );

    return res.status(201).json({ recentPackages: rows });
  } catch (err) {
    console.error('[saveRecentPackageActivity] Error:', err.message);
    return res.status(500).json({ error: 'Failed to save recent package activity.' });
  }
};

module.exports = {
  listRecentPackages,
  saveRecentPackageActivity,
};