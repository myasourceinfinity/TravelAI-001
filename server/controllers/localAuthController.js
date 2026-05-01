/**
 * localAuthController.js
 *
 * Handles Email/Password authentication flows:
 *  - signup:  3-table transaction (users + user_profiles + user_preferences)
 *  - login:   credential check → status check → session initialization
 */

const bcrypt      = require('bcrypt');
const pool        = require('../config/db');
const { sendVerificationEmail } = require('../utils/emailHelper');
const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  getExpiryDate,
} = require('../utils/jwtHelper');
const { writeAuditLog, initializeSession } = require('../utils/sessionHelper');

const SALT_ROUNDS = 12;


// ═══════════════════════════════════════════════════════════════════════════════
// SIGNUP  —  POST /api/auth/signup
// ═══════════════════════════════════════════════════════════════════════════════
const signup = async (req, res) => {
  const {
    // Phase 2 — credentials
    first_name, last_name, email, phone, password, dob, nationality,
    // Phase 1 — preferences
    budget_amount, currency, destination, location_types,
  } = req.body;

  const ip        = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // ── Basic required fields check ──────────────────────────────────────────────
  if (!first_name || !email || !password) {
    return res.status(400).json({ error: 'first_name, email, and password are required.' });
  }

  const client = await pool.connect();

  try {
    // ── 1. Duplicate email check ─────────────────────────────────────────────
    const { rows: existing } = await client.query(
      'SELECT id, auth_provider FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: 'Account Already Exists',
        detail: existing[0].auth_provider !== 'local'
          ? `This email is registered via ${existing[0].auth_provider}. Please use that sign-in method.`
          : 'An account with this email already exists. Please sign in.',
      });
    }

    // ── 2. Hash password ─────────────────────────────────────────────────────
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── 3. BEGIN TRANSACTION ─────────────────────────────────────────────────
    await client.query('BEGIN');

    // ── 4. Insert into users ─────────────────────────────────────────────────
    const { rows: userRows } = await client.query(
      `INSERT INTO users
         (first_name, last_name, email, phone, password_hash,
          role_type, status, auth_provider, email_verified)
       VALUES ($1, $2, $3, $4, $5, 'traveler', 'pending', 'local', FALSE)
       RETURNING id, first_name, email, role_type, status`,
      [
        first_name.trim(),
        last_name?.trim() || null,
        email.toLowerCase().trim(),
        phone?.trim() || null,
        password_hash,
      ]
    );
    const newUser = userRows[0];

    // ── 5. Insert into user_profiles ────────────────────────────────────────
    await client.query(
      `INSERT INTO user_profiles (user_id, dob, nationality)
       VALUES ($1, $2, $3)`,
      [
        newUser.id,
        dob        || null,
        nationality?.trim() || null,
      ]
    );

    // ── 6. Insert into user_preferences ─────────────────────────────────────
    await client.query(
      `INSERT INTO user_preferences
         (user_id, budget_amount, currency, destination, location_types)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        newUser.id,
        budget_amount  ? parseFloat(budget_amount) : null,
        currency?.trim() || 'USD',
        destination?.trim() || null,
        JSON.stringify(Array.isArray(location_types) ? location_types : []),
      ]
    );

    // ── 7. Audit log ─────────────────────────────────────────────────────────
    await writeAuditLog(client, {
      userId:    newUser.id,
      eventType: 'signup',
      ip,
      userAgent,
      metadata:  { email: newUser.email, auth_provider: 'local' },
    });

    // ── 8. COMMIT ────────────────────────────────────────────────────────────
    await client.query('COMMIT');

    // ── 9. Trigger email verification (async — don't block response) ─────────
    sendVerificationEmail({
      to:        newUser.email,
      firstName: newUser.first_name,
      token:     newUser.id,           // TODO: generate a short-lived signed token instead
    }).catch(err => console.error('Email send failed:', err.message));

    return res.status(201).json({
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id:         newUser.id,
        first_name: newUser.first_name,
        email:      newUser.email,
        role_type:  newUser.role_type,
        status:     newUser.status,
      },
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[signup] Transaction rolled back:', err.message);
    return res.status(500).json({ error: 'Server error during signup. Please try again.' });

  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN  —  POST /api/auth/login
// ═══════════════════════════════════════════════════════════════════════════════
const login = async (req, res) => {
  const { email, password } = req.body;
  const ip        = req.ip || req.socket?.remoteAddress;
  const userAgent = req.headers['user-agent'];

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const client = await pool.connect();

  try {
    // ── 1. Fetch user ────────────────────────────────────────────────────────
    const { rows } = await client.query(
      `SELECT id, first_name, last_name, email, password_hash,
              role_type, status, auth_provider
       FROM users
       WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (rows.length === 0) {
      // Don't reveal whether the email exists
      await writeAuditLog(client, {
        eventType: 'login_failed',
        ip,
        userAgent,
        metadata:  { email, reason: 'user_not_found' },
      });
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    const user = rows[0];

    // ── 2. OAuth-only account guard ──────────────────────────────────────────
    if (user.auth_provider !== 'local' || !user.password_hash) {
      return res.status(400).json({
        error: `This account was created with ${user.auth_provider} sign-in. Please use that method.`,
      });
    }

    // ── 3. Verify password ───────────────────────────────────────────────────
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      await writeAuditLog(client, {
        userId:    user.id,
        eventType: 'login_failed',
        ip,
        userAgent,
        metadata:  { reason: 'bad_password' },
      });
      return res.status(401).json({ error: 'Invalid Credentials' });
    }

    // ── 4. Status check ──────────────────────────────────────────────────────
    if (user.status !== 'active') {
      const messages = {
        pending:   'Your account is pending email verification.',
        suspended: 'Your account has been suspended. Please contact support.',
        deleted:   'This account has been deleted.',
      };
      return res.status(403).json({
        error:  messages[user.status] || `Account status: ${user.status}`,
        status: user.status,
      });
    }

    // ── 5. Session initialization ────────────────────────────────────────────
    await client.query('BEGIN');
    const session = await initializeSession(client, { user, ip, userAgent });
    await client.query('COMMIT');

    // Set refresh token as HttpOnly cookie
    res.cookie('refreshToken', session.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,  // 7 days in ms
    });

    return res.status(200).json({
      message:     'Login successful.',
      accessToken: session.accessToken,
      user:        session.user,
    });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[login] Error:', err.message);
    return res.status(500).json({ error: 'Server error during login. Please try again.' });

  } finally {
    client.release();
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// VERIFY EMAIL  —  POST /api/auth/verify-email
// ═══════════════════════════════════════════════════════════════════════════════
const verifyEmail = async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Verification token is missing.' });
  }

  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE users 
       SET status = 'active', email_verified = TRUE, updated_at = NOW() 
       WHERE id = $1 AND status = 'pending' 
       RETURNING id`,
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token, or account is already verified.' });
    }

    return res.status(200).json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('[verifyEmail] Error:', err.message);
    return res.status(500).json({ error: 'Server error during email verification.' });
  } finally {
    client.release();
  }
};

module.exports = { signup, login, verifyEmail };
