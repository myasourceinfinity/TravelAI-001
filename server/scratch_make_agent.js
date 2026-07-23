require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME     || 'mia_travel_db',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  ssl:      process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function run() {
  try {
    // Let's update all users in the development database to 'agent' role and 'active' status
    // so whichever login (local or Google OAuth) the user uses, they become an agent.
    const res = await pool.query(`
      UPDATE users 
      SET role_type = 'agent', status = 'active', email_verified = true
      RETURNING id, email, role_type, status
    `);
    console.log("Successfully updated users to agent role:", res.rows);
  } catch (err) {
    console.error("Error updating users to agent role:", err);
  } finally {
    await pool.end();
  }
}

run();
