const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:12345@localhost:5432/volunteer_management'
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // We must drop the check constraint and recreate it.
    // In PostgreSQL, constraints don't always have standard names unless specified.
    // Let's find the check constraint name for 'status' on 'opportunities'.
    const res = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'opportunities'::regclass
      AND contype = 'c'
      AND conname LIKE '%status%';
    `);
    
    for (const row of res.rows) {
      await client.query(`ALTER TABLE opportunities DROP CONSTRAINT "${row.conname}"`);
    }

    // Now add the new constraint
    await client.query(`
      ALTER TABLE opportunities 
      ADD CONSTRAINT opportunities_status_check 
      CHECK (status IN ('draft', 'pending', 'open', 'closed', 'cancelled'))
    `);
    
    await client.query('COMMIT');
    console.log('Migration successful: opportunities status updated to include pending.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

run();
