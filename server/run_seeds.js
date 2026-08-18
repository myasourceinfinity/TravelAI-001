const pool = require('./config/db');
const fs = require('fs');
const path = require('path');

async function runSeeds() {
  try {
    const seedPath = path.join(__dirname, 'db', 'seeds', '003_seed_demo_traveler.sql');
    const sql = fs.readFileSync(seedPath, 'utf8');
    await pool.query(sql);
    console.log("✔ Seed 003_seed_demo_traveler.sql executed successfully!");
  } catch (err) {
    console.error("✖ Failed to run seeds:", err.message);
  } finally {
    await pool.end();
  }
}

runSeeds();
