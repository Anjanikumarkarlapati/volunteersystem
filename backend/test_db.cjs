const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/volunteer_management' });
pool.query("SELECT email, role FROM users WHERE role = 'organization'").then(res => {
  console.log('Orgs:', res.rows);
  process.exit(0);
});
