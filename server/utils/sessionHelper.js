/**
 * sessionHelper.js
 * 
 * Shared logic for initializing a user session and writing audit logs.
 * Used by both localAuthController and googleAuthController.
 */

const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getExpiryDate,
} = require('./jwtHelper');

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER — write to audit_logs
// ═══════════════════════════════════════════════════════════════════════════════
async function writeAuditLog(client, { userId, eventType, ip, userAgent, metadata = {} }) {
  await client.query(
    `INSERT INTO audit_logs (user_id, event_type, ip_address, user_agent, metadata)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId || null, eventType, ip || null, userAgent || null, JSON.stringify(metadata)]
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER — session initialization (shared by local login + google auth)
// ═══════════════════════════════════════════════════════════════════════════════
async function initializeSession(client, { user, ip, userAgent }) {
  // 1. Update last_login_at
  await client.query(
    `UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1`,
    [user.id]
  );

  // 2. Generate tokens
  const accessToken  = generateAccessToken({ userId: user.id, email: user.email, role_type: user.role_type });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // 3. Store hashed refresh token in logins table
  await client.query(
    `INSERT INTO logins (user_id, session_token, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      user.id,
      hashToken(refreshToken),
      ip   || null,
      userAgent || null,
      getExpiryDate(process.env.JWT_REFRESH_EXPIRY || '7d'),
    ]
  );

  // 4. Fetch enriched context for the frontend router
  const { rows: prefRows } = await client.query(
    `SELECT p.budget_amount, p.currency, p.destination, p.location_types, p.travel_style,
            pr.nationality
     FROM user_preferences p
     LEFT JOIN user_profiles pr ON pr.user_id = p.user_id
     WHERE p.user_id = $1`,
    [user.id]
  );
  const context = prefRows[0] || {};

  // 5. Audit success
  await writeAuditLog(client, {
    userId:    user.id,
    eventType: 'login_success',
    ip,
    userAgent,
    metadata:  { auth_provider: user.auth_provider },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id:             user.id,
      first_name:     user.first_name,
      last_name:      user.last_name,
      email:          user.email,
      role_type:      user.role_type,
      status:         user.status,
      auth_provider:  user.auth_provider,
      // Travel context
      budget_amount:  context.budget_amount  || null,
      currency:       context.currency       || 'USD',
      destination:    context.destination    || null,
      location_types: context.location_types || [],
      travel_style:   context.travel_style   || {},
      nationality:    context.nationality    || null,
    },
  };
}

module.exports = {
  writeAuditLog,
  initializeSession,
};
