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
    // 1. Get user profiles
    const profilesRes = await pool.query(`
      SELECT up.id, up.user_id, u.email 
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
    `);
    console.log("Existing user profiles:", profilesRes.rows);

    if (profilesRes.rows.length > 0) {
      // Let's update all agent packages to belong to all user profiles to make sure they show up!
      // Or let's update them to belong to the profile of a specific test user like traveler_test_123@example.com
      // Let's find the profile ID for traveler_test_123@example.com
      const targetProfile = profilesRes.rows.find(p => p.email.includes('mya.sourceinfinity') || p.email.includes('traveler_test_123'));
      const profileId = targetProfile ? targetProfile.id : profilesRes.rows[0].id;
      
      console.log(`Assigning all packages to profile ID: ${profileId} (${targetProfile ? targetProfile.email : 'first profile'})`);
      
      await pool.query(`
        UPDATE agent_packages
        SET provider_id = $1
      `, [profileId]);
      
      console.log("Successfully assigned packages to test agent.");
    }
  } catch (err) {
    console.error("Error assigning packages:", err);
  } finally {
    await pool.end();
  }
}

run();
