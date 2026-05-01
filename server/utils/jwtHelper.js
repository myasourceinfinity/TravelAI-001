/**
 * jwtHelper.js
 *
 * Wraps jsonwebtoken to generate and verify:
 *  - Short-lived ACCESS tokens  (default 15m)
 *  - Long-lived  REFRESH tokens (default 7d)
 *
 * Also exposes hashToken() to SHA-256 hash a raw JWT before
 * storing it in the logins table.
 */

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_SECRET   = process.env.JWT_SECRET          || 'dev_access_secret_change_me';
const REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET  || 'dev_refresh_secret_change_me';
const ACCESS_EXPIRY   = process.env.JWT_EXPIRY          || '15m';
const REFRESH_EXPIRY  = process.env.JWT_REFRESH_EXPIRY  || '7d';

/**
 * generateAccessToken
 * @param {object} payload  — { userId, email, role_type }
 * @returns {string}  signed JWT
 */
function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRY,
    issuer:    'mia-travel-ai',
    audience:  'mia-travel-client',
  });
}

/**
 * generateRefreshToken
 * @param {object} payload  — { userId }
 * @returns {string}  signed JWT
 */
function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRY,
    issuer:    'mia-travel-ai',
    audience:  'mia-travel-client',
  });
}

/**
 * verifyAccessToken
 * @param {string} token
 * @returns {object} decoded payload
 * @throws  JsonWebTokenError | TokenExpiredError
 */
function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET, {
    issuer:   'mia-travel-ai',
    audience: 'mia-travel-client',
  });
}

/**
 * verifyRefreshToken
 * @param {string} token
 * @returns {object} decoded payload
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET, {
    issuer:   'mia-travel-ai',
    audience: 'mia-travel-client',
  });
}

/**
 * hashToken — SHA-256 hash a raw JWT for safe DB storage
 * @param {string} rawToken
 * @returns {string}  hex digest
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * getExpiryDate — converts a JWT expiry string to a Date object
 * Used when inserting into logins.expires_at
 * @param {string} expiry — e.g. '7d', '15m'
 * @returns {Date}
 */
function getExpiryDate(expiry) {
  const now = Date.now();
  const unit = expiry.slice(-1);
  const val  = parseInt(expiry.slice(0, -1), 10);
  const ms   = { m: 60_000, h: 3_600_000, d: 86_400_000 }[unit] || 0;
  return new Date(now + val * ms);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  getExpiryDate,
};
