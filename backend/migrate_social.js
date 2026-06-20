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

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Add geolocation to opportunities
    await client.query(`
      ALTER TABLE opportunities
        ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
        ADD COLUMN IF NOT EXISTS urgency_level VARCHAR(10) DEFAULT 'normal'
          CHECK (urgency_level IN ('low', 'normal', 'high', 'critical'));
    `);

    // Create feedback table
    await client.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
        reviewer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
        tags TEXT[] DEFAULT '{}',
        comment TEXT,
        feedback_type VARCHAR(20) NOT NULL CHECK (feedback_type IN ('event', 'volunteer')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(attendance_id, reviewer_user_id, feedback_type)
      );
    `);
    
    // Create index for fast nearby queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_opportunities_geo
        ON opportunities (latitude, longitude)
        WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    // Seed a few opportunities with coordinates near a central location for demo
    await client.query(`
      UPDATE opportunities
      SET latitude = 28.6139 + (RANDOM() - 0.5) * 0.1,
          longitude = 77.2090 + (RANDOM() - 0.5) * 0.1,
          urgency_level = (ARRAY['low','normal','high','critical'])[floor(random()*4+1)]
      WHERE latitude IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
