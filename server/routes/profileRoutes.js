/**
 * profileRoutes.js
 *
 * Mount: app.use('/api/user', authMiddleware, profileRoutes)
 *
 * Routes:
 *  GET  /api/user/profile  — fetch authenticated user's full profile
 *  PUT  /api/user/profile  — update profile fields
 */

const express = require('express');
const router  = express.Router();

const { getProfile, updateProfile } = require('../controllers/profileController');

router.get('/profile',  getProfile);
router.put('/profile',  updateProfile);

module.exports = router;
