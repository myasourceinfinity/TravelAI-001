/**
 * app.js — Express application entry point
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Import pool to trigger the startup connectivity test
require('./config/db');

const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const tripRoutes = require('./routes/tripRoutes');
const authMiddleware = require('./middleware/authMiddleware');
const packageRoutes = require('./routes/packageRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { requireRole, ADMIN_ROLES } = require('./middleware/requireRole');
const recentSearchRoutes = require('./routes/recentSearchRoutes');
const recentPackageRoutes = require('./routes/recentPackageRoutes');


const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,   // required for HttpOnly cookie to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/user', authMiddleware, profileRoutes);
app.use('/api/trips', authMiddleware, tripRoutes);
app.use('/api/packages', authMiddleware, packageRoutes);
app.use('/api/booking', authMiddleware, bookingRoutes);
app.use('/api/admin', authMiddleware, requireRole(...ADMIN_ROLES), adminRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/recent-searches', authMiddleware, recentSearchRoutes);
app.use('/api/recent-packages', authMiddleware, recentPackageRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

// // ── Start server ──────────────────────────────────────────────────────────────
// app.listen(PORT, () => {
//   console.log(`\n🚀 AITravelBuddy API running on http://localhost:${PORT}`);
//   console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
// });

// module.exports = app;

// ── Start server (Only in local development) ──────────────────────────────────
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 TravelAI API running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

module.exports = app;
