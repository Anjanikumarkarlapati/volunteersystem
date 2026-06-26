require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const res = await pool.query(`
    SELECT att.id, e.title, att.status, att.notes, att.verification_status, c.id as cert_id
    FROM attendance att
    JOIN events e ON e.id = att.event_id
    LEFT JOIN certificates c ON c.event_id = att.event_id AND c.volunteer_id = att.volunteer_id
    WHERE e.title LIKE '%Blood%'
  `);
  console.log(JSON.stringify(res.rows, null, 2));
  process.exit(0);
}
run();
