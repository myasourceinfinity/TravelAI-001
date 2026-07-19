/**
 * bookingRoutes.js
 * Mount: app.use('/api/booking', authMiddleware, bookingRoutes)
 *
 * POST /api/booking/search              — search flights + hotels for confirmed itinerary
 * GET  /api/booking/flights/locations   — resolve city to airport id
 * GET  /api/booking/hotels/locations    — resolve city to hotel dest id
 */
const express = require('express');
const router  = express.Router();
const { searchForItinerary, flightLocations, hotelLocations } = require('../controllers/bookingController');

router.post('/search',              searchForItinerary);
router.get('/flights/locations',    flightLocations);
router.get('/hotels/locations',     hotelLocations);

module.exports = router;
