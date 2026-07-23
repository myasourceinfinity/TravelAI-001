/**
 * adminRoutes.js
 *
 * Mount: app.use('/api/admin', authMiddleware, requireRole(...ADMIN_ROLES), adminRoutes)
 *
 * Routes:
 *  GET    /api/admin/stats                    — platform analytics
 *  GET    /api/admin/agents                   — list / search agents
 *  POST   /api/admin/agents                   — provision new agent
 *  GET    /api/admin/agents/:id               — agent detail + stats
 *  PATCH  /api/admin/agents/:id/status        — suspend / activate
 *  PATCH  /api/admin/agents/:id/role          — change role
 *  GET    /api/admin/agents/:id/packages      — agent's packages
 *  GET    /api/admin/audit-logs               — audit log with filters
 */

const express = require('express');
const router  = express.Router();

const {
  listAgents,
  getAgentDetail,
  createAgent,
  updateAgentStatus,
  updateAgentRole,
  getAgentPackages,
  getAuditLogs,
  getStats,
} = require('../controllers/adminController');

router.get('/stats',                  getStats);
router.get('/agents',                 listAgents);
router.post('/agents',                createAgent);
router.get('/agents/:id',             getAgentDetail);
router.patch('/agents/:id/status',    updateAgentStatus);
router.patch('/agents/:id/role',      updateAgentRole);
router.get('/agents/:id/packages',    getAgentPackages);
router.get('/audit-logs',             getAuditLogs);

module.exports = router;
