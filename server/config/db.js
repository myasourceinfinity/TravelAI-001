/**
 * db.js — PostgreSQL connection pool
 *
 * Exports a singleton `pg.Pool` instance used by all controllers.
 * On module load, fires a test query to confirm connectivity.
 * Set DB_SSL=true in .env when connecting to cloud/prod PostgreSQL.
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'mia_travel_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Pool sizing
  max:             10,   // max concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// ── Connectivity test on startup ──────────────────────────────────────────────
pool.query('SELECT NOW() AS db_time')
  .then(res  => console.log(`✔  PostgreSQL connected — server time: ${res.rows[0].db_time}`))
  .catch(err => {
    console.error('✖  PostgreSQL connection FAILED:', err.message);
    console.error('   Check your .env DB_* variables and ensure PostgreSQL is running.');
    process.exit(1);  // hard fail — app cannot run without a database
  });

// ── Error event handler (catches idle client errors) ─────────────────────────
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err.message);
});

module.exports = pool;
