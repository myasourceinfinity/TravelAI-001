/**
 * googleAuthController.js
 *
 * Handles Google OAuth flows.
 */

const { OAuth2Client } = require('google-auth-library');
const pool = require('../config/db');
const { writeAuditLog, initializeSession } = require('../utils/sessionHelper');
const { sendVerificationEmail } = require('../utils/emailHelper');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleAuth = async (req, res) => {
  const { credential } = req.body;
  const ip = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!credential) {
    return res.status(400).json({ error: 'Google credential is required.' });
  }

  const dbClient = await pool.connect();

  try {
    // 1. Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token payload.' });
    }

    const { sub: googleId, email, given_name, family_name } = payload;
    const userEmail = email.toLowerCase().trim();

    await dbClient.query('BEGIN');

    // 2. Check if user exists
    let { rows } = await dbClient.query(
      `SELECT id, first_name, last_name, email, password_hash,
              role_type, status, auth_provider
       FROM users
       WHERE email = $1`,
      [userEmail]
    );

    let user;

    if (rows.length > 0) {
      user = rows[0];

      // If user exists but is local
      if (user.auth_provider === 'local') {
        await writeAuditLog(dbClient, {
          userId: user.id,
          eventType: 'login_failed',
          ip,
          userAgent,
          metadata: { reason: 'used_google_for_local_account' },
        });
        await dbClient.query('ROLLBACK');
        return res.status(400).json({
          error: 'This email is registered with a password. Please use email/password to sign in.',
        });
      }

      // If suspended/deleted etc
      if (user.status !== 'active') {
        await dbClient.query('ROLLBACK');
        return res.status(403).json({ error: `Account status: ${user.status}` });
      }

      // Update provider_id if it's not set
      await dbClient.query(
        `UPDATE users SET provider_id = $1 WHERE id = $2 AND provider_id IS NULL`,
        [googleId, user.id]
      );

    } else {
      // 3. User doesn't exist, create them
      const { rows: newUserRows } = await dbClient.query(
        `INSERT INTO users
           (first_name, last_name, email, role_type, status, auth_provider, provider_id, email_verified)
         VALUES ($1, $2, $3, 'traveler', 'pending', 'google', $4, FALSE)
         RETURNING id, first_name, last_name, email, role_type, status, auth_provider`,
        [given_name || 'User', family_name || null, userEmail, googleId]
      );
      user = newUserRows[0];

      await dbClient.query(
        `INSERT INTO user_profiles (user_id) VALUES ($1)`,
        [user.id]
      );

      await dbClient.query(
        `INSERT INTO user_preferences (user_id, currency) VALUES ($1, 'USD')`,
        [user.id]
      );

      await writeAuditLog(dbClient, {
        userId: user.id,
        eventType: 'signup',
        ip,
        userAgent,
        metadata: { email: user.email, auth_provider: 'google' },
      });

      await dbClient.query('COMMIT');

      // Trigger email verification
      sendVerificationEmail({
        to: user.email,
        firstName: user.first_name,
        token: user.id,
      }).catch(err => console.error('Email send failed:', err.message));

      return res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account.',
        user: user,
        isNewUser: true
      });
    }

    // 4. Create Session
    const session = await initializeSession(dbClient, { user, ip, userAgent });
    await dbClient.query('COMMIT');

    res.cookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: 'Login successful.',
      accessToken: session.accessToken,
      user: session.user,
    });

  } catch (err) {
    await dbClient.query('ROLLBACK').catch(() => { });
    console.error('[googleAuth] Error:', err.message);
    return res.status(500).json({ error: 'Server error during Google login.' });
  } finally {
    dbClient.release();
  }
};

module.exports = { googleAuth };
