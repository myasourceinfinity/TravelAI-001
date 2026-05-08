/**
 * tripRoutes.js
 *
 * Mount: app.use('/api/trips', authMiddleware, tripRoutes)
 *
 * Routes:
 *  POST /api/trips/plan  — generate AI trip plan from description
 */

const express = require('express');
const router  = express.Router();

const { planTrip } = require('../controllers/tripController');

router.post('/plan', planTrip);

module.exports = router;
