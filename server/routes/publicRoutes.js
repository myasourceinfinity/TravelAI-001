/**
 * publicRoutes.js
 *
 * Mount: app.use('/api/public', publicRoutes)   — NO authMiddleware
 *
 * Routes:
 *  GET /api/public/agents       — list active agents (public marketplace)
 *  GET /api/public/agents/:id   — public agent profile + active packages
 */

const express = require('express');
const router  = express.Router();

const authMiddleware = require('../middleware/authMiddleware');

const {
  listPublicAgents,
  getPublicAgentDetail,
  createAgentReview,
} = require('../controllers/publicAgentController');

router.get('/agents',     listPublicAgents);
router.get('/agents/:id', getPublicAgentDetail);
router.post('/agents/:id/reviews', authMiddleware, createAgentReview);

module.exports = router;
