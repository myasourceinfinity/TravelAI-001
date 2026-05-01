/**
 * authRoutes.js
 *
 * Mount: app.use('/api/auth', authRoutes)
 *
 * Routes:
 *  POST /api/auth/signup           — local registration
 *  POST /api/auth/login            — local credential login
 *  POST /api/auth/forgot-password  — request password reset email
 *  POST /api/auth/reset-password   — reset password with token
 *  POST /api/auth/google           — Google OAuth token verification
 *  POST /api/auth/logout           — revoke refresh token session
 */

const express      = require('express');
const router       = express.Router();

const { signup, login, verifyEmail } = require('../controllers/localAuthController');
const { forgotPassword, resetPassword } = require('../controllers/passwordResetController');
const { googleAuth } = require('../controllers/googleAuthController');

// ── Local Auth ────────────────────────────────────────────────
router.post('/signup', signup);
router.post('/login',  login);
router.post('/verify-email', verifyEmail);

// ── Password Reset ────────────────────────────────────────────
router.post('/forgot-password', forgotPassword);
router.post('/reset-password',  resetPassword);

// ── Google OAuth ──────────────────────────────────────────────
router.post('/google', googleAuth);

// ── Logout (to be added in next phase) ────────────────────────
// router.post('/logout', logout);

module.exports = router;

