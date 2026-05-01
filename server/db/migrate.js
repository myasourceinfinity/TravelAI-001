/**
 * migrate.js — Idempotent SQL migration runner
 *
 * Usage:  node db/migrate.js
 *
 * Behaviour:
 *  1. Connects to PostgreSQL using .env variables.
 *  2. Creates a `schema_migrations` tracking table if it doesn't exist.
 *  3. Reads all *.sql files from db/migrations/ in alphabetical order.
 *  4. Skips files already recorded in schema_migrations.
 *  5. Executes each pending file inside its own transaction.
 *  6. Records filename + timestamp on success.
 *  7. Rolls back + exits(1) on any failure.
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs   = require('fs');
const path = require('path');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'mia_travel_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  const client = await pool.connect();

  try {
    // ── 1. Ensure tracking table exists ─────────────────────────────────────
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id          SERIAL      PRIMARY KEY,
        filename    VARCHAR(255) NOT NULL UNIQUE,
        applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✔  schema_migrations table ready.');

    // ── 2. Load applied migrations ───────────────────────────────────────────
    const { rows: applied } = await client.query(
      'SELECT filename FROM schema_migrations ORDER BY filename'
    );
    const appliedSet = new Set(applied.map(r => r.filename));

    // ── 3. Read migration files in order ────────────────────────────────────
    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter(f => f.endsWith('.sql'))
      .sort(); // alphabetical = numeric order via 001_, 002_, etc.

    let ran = 0;

    for (const file of files) {
      if (appliedSet.has(file)) {
        console.log(`   skipped  ${file}  (already applied)`);
        continue;
      }

      const filePath = path.join(MIGRATIONS_DIR, file);
      const sql      = fs.readFileSync(filePath, 'utf8');

      // ── 4. Run inside a transaction ────────────────────────────────────────
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file]
        );
        await client.query('COMMIT');
        console.log(`✔  applied  ${file}`);
        ran++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`✖  FAILED   ${file}`);
        console.error(err.message);
        process.exit(1);
      }
    }

    if (ran === 0) {
      console.log('\n✔  Database is already up to date. No migrations ran.');
    } else {
      console.log(`\n✔  ${ran} migration(s) applied successfully.`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error('Migration runner error:', err.message);
  process.exit(1);
});
