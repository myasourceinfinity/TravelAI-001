/**
 * authMiddleware.js
 *
 * Protects routes by verifying the JWT access token from the
 * Authorization header. On success, attaches decoded payload to req.user.
 */

const { verifyAccessToken } = require('../utils/jwtHelper');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;          // { userId, email, role_type, iat, exp, … }
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Session expired. Please sign in again.'
        : 'Invalid authentication token.';
    return res.status(401).json({ error: message });
  }
}

module.exports = authMiddleware;
