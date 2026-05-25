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

const { planTrip, saveTrip, getUserTrips } = require('../controllers/tripController');

router.get('/', getUserTrips);
router.post('/plan', planTrip);
router.post('/save', saveTrip);

module.exports = router;
