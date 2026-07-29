/**
 * tripRoutes.js
 *
 * Mount: app.use('/api/trips', authMiddleware, tripRoutes)
 *
 * NOTE: this file was reconstructed from the known-working real endpoints
 * (confirmed via tripService.js) plus the new booking engine routes added
 * this session. Please diff this against your actual tripRoutes.js before
 * replacing — if your real file has additional routes not listed here
 * (e.g. package-related routes), merge them back in.
 *
 * Routes:
 *  GET    /api/trips                    — list all trips for the user
 *  GET    /api/trips/:id                — get a single trip
 *  POST   /api/trips/plan               — generate AI trip plan from description
 *  POST   /api/trips/save               — persist a generated plan
 *  POST   /api/trips/chat               — agentic conversational planning (the REAL chat endpoint)
 *  PUT    /api/trips/:id                — update an existing trip
 *  DELETE /api/trips/:id                — delete a trip
 *
 *  POST   /api/trips/booking/confirm    — confirm a booking (creates a pending_payment reservation)
 *  GET    /api/trips/booking/:id        — fetch a single booking
 *  GET    /api/trips/bookings           — list all bookings for the user
 */

const express = require('express');
const router  = express.Router();

const {
  planTrip,
  saveTrip,
  getUserTrips,
  getTripById,
  modifyTrip,
  deleteTrip,
  chatWithAI,
  confirmBooking,
  getBookingById,
  getUserBookings,
} = require('../controllers/tripController');

// ── Existing trip routes ──────────────────────────────────────────────────────
router.get('/',        getUserTrips);
router.post('/plan',   planTrip);
router.post('/save',   saveTrip);
router.post('/chat',   chatWithAI);

// ── Booking engine routes (NEW) ───────────────────────────────────────────────
// Registered BEFORE '/:id' so '/bookings' and '/booking/...' aren't swallowed
// by the generic ':id' param routes below.
router.get('/bookings',          getUserBookings);
router.post('/booking/confirm',  confirmBooking);
router.get('/booking/:id',       getBookingById);

// ── Generic :id routes (must come after more specific routes above) ──────────
router.get('/:id',     getTripById);
router.put('/:id',     modifyTrip);
router.delete('/:id',  deleteTrip);

module.exports = router;
