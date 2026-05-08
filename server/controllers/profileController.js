/**
 * profileController.js
 *
 * Authenticated endpoints for the traveller dashboard:
 *  - getProfile:    GET  /api/user/profile
 *  - updateProfile: PUT  /api/user/profile
 */

const pool = require('../config/db');

// ═══════════════════════════════════════════════════════════════════════════════
// GET PROFILE  —  GET /api/user/profile
// ═══════════════════════════════════════════════════════════════════════════════
const getProfile = async (req, res) => {
  const { userId } = req.user;

  try {
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email, u.phone,
         u.role_type, u.status, u.auth_provider, u.email_verified,
         u.last_login_at, u.created_at,
         pr.dob, pr.nationality, pr.avatar_url, pr.bio,
         p.budget_amount, p.currency, p.destination,
         p.location_types, p.travel_style
       FROM users u
       LEFT JOIN user_profiles   pr ON pr.user_id = u.id
       LEFT JOIN user_preferences p ON p.user_id  = u.id
       WHERE u.id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error('[getProfile] Error:', err.message);
    return res.status(500).json({ error: 'Failed to fetch profile.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE PROFILE  —  PUT /api/user/profile
// ═══════════════════════════════════════════════════════════════════════════════
const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const {
    // users table
    first_name, last_name, phone,
    // user_profiles table
    dob, nationality, bio,
    // user_preferences table
    budget_amount, currency, destination, location_types, travel_style,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 1. Update users table ─────────────────────────────────────────────────
    await client.query(
      `UPDATE users
       SET first_name = COALESCE($2, first_name),
           last_name  = COALESCE($3, last_name),
           phone      = COALESCE($4, phone),
           updated_at = NOW()
       WHERE id = $1`,
      [userId, first_name, last_name, phone]
    );

    // ── 2. Upsert user_profiles ───────────────────────────────────────────────
    await client.query(
      `INSERT INTO user_profiles (user_id, dob, nationality, bio, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         dob         = COALESCE($2, user_profiles.dob),
         nationality = COALESCE($3, user_profiles.nationality),
         bio         = COALESCE($4, user_profiles.bio),
         updated_at  = NOW()`,
      [userId, dob || null, nationality || null, bio || null]
    );

    // ── 3. Upsert user_preferences ────────────────────────────────────────────
    await client.query(
      `INSERT INTO user_preferences
         (user_id, budget_amount, currency, destination, location_types, travel_style, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         budget_amount  = COALESCE($2, user_preferences.budget_amount),
         currency       = COALESCE($3, user_preferences.currency),
         destination    = COALESCE($4, user_preferences.destination),
         location_types = COALESCE($5, user_preferences.location_types),
         travel_style   = COALESCE($6, user_preferences.travel_style),
         updated_at     = NOW()`,
      [
        userId,
        budget_amount != null ? parseFloat(budget_amount) : null,
        currency || null,
        destination || null,
        location_types ? JSON.stringify(location_types) : null,
        travel_style ? JSON.stringify(travel_style) : null,
      ]
    );

    await client.query('COMMIT');

    // ── 4. Re-fetch and return the updated profile ────────────────────────────
    const { rows } = await pool.query(
      `SELECT
         u.id, u.first_name, u.last_name, u.email, u.phone,
         u.role_type, u.status, u.auth_provider, u.email_verified,
         u.last_login_at, u.created_at,
         pr.dob, pr.nationality, pr.avatar_url, pr.bio,
         p.budget_amount, p.currency, p.destination,
         p.location_types, p.travel_style
       FROM users u
       LEFT JOIN user_profiles   pr ON pr.user_id = u.id
       LEFT JOIN user_preferences p ON p.user_id  = u.id
       WHERE u.id = $1`,
      [userId]
    );

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: rows[0],
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[updateProfile] Error:', err.message);
    return res.status(500).json({ error: 'Failed to update profile.' });
  } finally {
    client.release();
  }
};

module.exports = { getProfile, updateProfile };
