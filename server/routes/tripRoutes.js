/**
 * tripRoutes.js
 *
 * Mount: app.use('/api/trips', authMiddleware, tripRoutes)
 *
 * Routes:
 *  GET  /api/trips       — get all saved trips for the authenticated user
 *  POST /api/trips/plan  — generate AI trip plan from description
 *  POST /api/trips/save  — save a generated plan to the database
 *  PUT  /api/trips/:id   — partially update an existing trip
 */

const express = require('express');
const router  = express.Router();

const { planTrip, saveTrip, getUserTrips, getTripById, modifyTrip, deleteTrip, chatWithAI } = require('../controllers/tripController');

router.get('/',         getUserTrips);
router.post('/plan',    planTrip);
router.post('/save',    saveTrip);
router.post('/chat',    chatWithAI);
router.get('/:id',      getTripById);
router.put('/:id',      modifyTrip);
router.delete('/:id',   deleteTrip);

module.exports = router;
