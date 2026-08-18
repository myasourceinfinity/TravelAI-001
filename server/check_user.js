const pool = require('./config/db');

async function checkUser() {
  try {
    const { rows } = await pool.query("SELECT id, email, first_name, role_type, status FROM users");
    console.log("Users in DB:", rows);
  } catch (err) {
    console.error("Error fetching users:", err.message);
  } finally {
    await pool.end();
  }
}

checkUser();
