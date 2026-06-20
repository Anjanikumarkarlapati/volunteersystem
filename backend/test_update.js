import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: '12345',
      database: 'volunteer_management',
    });

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`SELECT id, event_id FROM attendance WHERE status = 'attended' AND verification_status = 'pending' LIMIT 1`);
    if (res.rows.length === 0) return console.log('no pending attendance to verify');
    const attId = res.rows[0].id;
    
    const jwt = await import('jsonwebtoken');
    const adminRes = await client.query(`SELECT * FROM users WHERE role = 'admin' LIMIT 1`);
    const admin = adminRes.rows[0];
    const token = jwt.default.sign({ sub: admin.id, id: admin.id, role: admin.role }, process.env.JWT_ACCESS_SECRET || 'replace-with-a-long-random-access-secret-super-secure-volunteer-hub', { expiresIn: '1d' });
    
    console.log('Testing Verify on attendance:', attId);

    const patchRes = await fetch(`http://localhost:5000/api/attendance/${attId}/verify`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'verify' })
    });
    console.log('Status code:', patchRes.status);
    console.log('Response:', await patchRes.text());
    
  } catch (err) {
    console.error('Error in simulation:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
