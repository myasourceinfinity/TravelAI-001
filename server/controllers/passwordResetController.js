/**
 * passwordResetController.js
 *
 * Handles the "Forgot Password → Reset Password" flow:
 *  - forgotPassword:  generates a token, stores its hash, emails raw token
 *  - resetPassword:   validates token, updates password, marks token used
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool   = require('../config/db');
const { sendPasswordResetEmail } = require('../utils/emailHelper');

const SALT_ROUNDS      = 12;
const RESET_EXPIRY_MS  = 60 * 60 * 1000; // 1 hour

/**
 * SHA-256 hash a raw token for safe DB storage / lookup
 */
function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD  —  POST /api/auth/forgot-password
// ═══════════════════════════════════════════════════════════════════════════════
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    // 1. Look up user — always return 200 to prevent email enumeration
    const { rows } = await pool.query(
      'SELECT id, first_name, email, auth_provider FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Don't reveal that the email doesn't exist
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    const user = rows[0];

    // 2. Don't allow reset for OAuth-only accounts
    if (user.auth_provider !== 'local') {
      return res.status(200).json({
        message: 'If that email is registered, a reset link has been sent.',
      });
    }

    // 3. Invalidate any existing unused tokens for this user
    await pool.query(
      `UPDATE password_resets SET used = TRUE WHERE user_id = $1 AND used = FALSE`,
      [user.id]
    );

    // 4. Generate a new token
    const rawToken  = crypto.randomUUID();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS);

    await pool.query(
      `INSERT INTO password_resets (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    // 5. Send email (placeholder logs to console)
    await sendPasswordResetEmail({
      to:        user.email,
      firstName: user.first_name,
      token:     rawToken,
    });

    return res.status(200).json({
      message: 'If that email is registered, a reset link has been sent.',
    });

  } catch (err) {
    console.error('[forgotPassword] Error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// RESET PASSWORD  —  POST /api/auth/reset-password
// ═══════════════════════════════════════════════════════════════════════════════
const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and new password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  const client = await pool.connect();

  try {
    // 1. Hash the incoming token and look it up
    const tokenHash = hashToken(token);

    const { rows } = await client.query(
      `SELECT pr.id, pr.user_id, pr.expires_at, u.email
       FROM password_resets pr
       JOIN users u ON u.id = pr.user_id
       WHERE pr.token_hash = $1 AND pr.used = FALSE`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or already-used reset token.' });
    }

    const resetRecord = rows[0];

    // 2. Check expiry
    if (new Date(resetRecord.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired. Please request a new one.' });
    }

    // 3. Transaction: update password + mark token used + audit log
    await client.query('BEGIN');

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await client.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [passwordHash, resetRecord.user_id]
    );

    await client.query(
      `UPDATE password_resets SET used = TRUE WHERE id = $1`,
      [resetRecord.id]
    );

    // Audit log
    await client.query(
      `INSERT INTO audit_logs (user_id, event_type, ip_address, user_agent, metadata)
       VALUES ($1, 'password_reset', $2, $3, $4)`,
      [
        resetRecord.user_id,
        req.ip || req.socket?.remoteAddress || null,
        req.headers['user-agent'] || null,
        JSON.stringify({ email: resetRecord.email }),
      ]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Password updated successfully. You can now sign in with your new password.',
    });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[resetPassword] Error:', err.message);
    return res.status(500).json({ error: 'Server error. Please try again.' });

  } finally {
    client.release();
  }
};

module.exports = { forgotPassword, resetPassword };
