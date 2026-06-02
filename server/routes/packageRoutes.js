/**
 * packageRoutes.js
 * Mount: app.use('/api/packages', authMiddleware, packageRoutes)
 *
 * GET /api/packages?destinations=Auckland,Rotorua
 */
const express = require('express');
const router  = express.Router();
const { getMatchingPackages } = require('../controllers/packageController');

router.get('/', getMatchingPackages);

module.exports = router;
