/**
 * requireRole.js
 *
 * Factory middleware that restricts a route to specific role_type values.
 * Must be used AFTER authMiddleware (which populates req.user).
 *
 * Usage:
 *   router.get('/admin/agents', requireRole('admin','superadmin'), handler);
 *   app.use('/api/admin', authMiddleware, requireRole(...ADMIN_ROLES), adminRoutes);
 */

const ADMIN_ROLES   = ['admin', 'useradmin', 'superadmin'];
const ELEVATED_ROLES = ['admin', 'useradmin', 'superadmin']; // roles only superadmin can assign

/**
 * requireRole — returns Express middleware that enforces role membership.
 * @param {...string} allowed — one or more role_type strings
 */
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role_type)) {
      return res.status(403).json({ error: 'Access denied. Insufficient role.' });
    }
    next();
  };
}

module.exports = { requireRole, ADMIN_ROLES, ELEVATED_ROLES };
