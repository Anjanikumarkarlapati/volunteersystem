import pg from 'pg';
import bcrypt from 'bcryptjs';
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
    await client.query('BEGIN');

    // 1. Get or create an organization user
    let orgRes = await client.query(`SELECT id FROM users WHERE role = 'organization' LIMIT 1`);
    let orgUserId;
    if (orgRes.rows.length > 0) {
      orgUserId = orgRes.rows[0].id;
    } else {
      const hp = await bcrypt.hash('Password123!', 10);
      const res = await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        ['demo_org@example.com', hp, 'Demo Organization', 'organization']
      );
      orgUserId = res.rows[0].id;
      await client.query(
        `INSERT INTO organizations (user_id, name, city, state) VALUES ($1, $2, $3, $4)`,
        [orgUserId, 'Demo NGO', 'New York', 'NY']
      );
    }

    const orgProfileRes = await client.query(`SELECT id FROM organizations WHERE user_id = $1`, [orgUserId]);
    const organizationId = orgProfileRes.rows[0].id;

    // 2. Create the demo volunteer
    const email = 'demo_volunteer@example.com';
    const pwd = await bcrypt.hash('Password123!', 10);
    let volUserRes = await client.query(`SELECT id FROM users WHERE email = $1`, [email]);
    let volUserId;
    if (volUserRes.rows.length > 0) {
      volUserId = volUserRes.rows[0].id;
      console.log('Demo volunteer user already exists. ID:', volUserId);
    } else {
      const res = await client.query(
        `INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING id`,
        [email, pwd, 'Demo Volunteer', 'volunteer']
      );
      volUserId = res.rows[0].id;
      await client.query(
        `INSERT INTO volunteers (user_id, location, total_hours) VALUES ($1, $2, $3)`,
        [volUserId, 'Demo City', 40]
      );
    }

    const volProfileRes = await client.query(`SELECT id FROM volunteers WHERE user_id = $1`, [volUserId]);
    const volunteerId = volProfileRes.rows[0].id;

    // 3. Create two opportunities
    const opp1Res = await client.query(
      `INSERT INTO opportunities (organization_id, title, description, category, capacity, start_date, end_date, hours_estimate, status) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE + INTERVAL '10 days', 20, 'open') RETURNING id`,
      [organizationId, '5-Day Environment Challenge', 'Help the environment over 5 days', 'Environment', 10]
    );
    const opp1Id = opp1Res.rows[0].id;

    const opp2Res = await client.query(
      `INSERT INTO opportunities (organization_id, title, description, category, capacity, start_date, end_date, hours_estimate, status) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '15 days', 20, 'open') RETURNING id`,
      [organizationId, '5-Day Education Challenge', 'Help with education over 5 days', 'Education', 10]
    );
    const opp2Id = opp2Res.rows[0].id;

    // 4. Create 5 events for opp1 and 5 events for opp2, then assign
    // Opp 1 events (Completed)
    for (let i = 0; i < 5; i++) {
      const evRes = await client.query(
        `INSERT INTO events (organization_id, opportunity_id, title, start_at, end_at, status) 
         VALUES ($1, $2, $3, NOW() - INTERVAL '${5 - i} days', NOW() - INTERVAL '${5 - i} days' + INTERVAL '4 hours', 'completed') RETURNING id`,
        [organizationId, opp1Id, `Env Challenge Day ${i+1}`]
      );
      await client.query(
        `INSERT INTO attendance (event_id, volunteer_id, status, hours, notes, verification_status, verified_at, verified_by)
         VALUES ($1, $2, 'attended', 4, '5 days challenge day', 'verified', NOW(), $3)`,
        [evRes.rows[0].id, volunteerId, orgUserId]
      );
    }

    // Opp 2 events (Completed)
    for (let i = 0; i < 5; i++) {
      const evRes = await client.query(
        `INSERT INTO events (organization_id, opportunity_id, title, start_at, end_at, status) 
         VALUES ($1, $2, $3, NOW() - INTERVAL '${5 - i} days', NOW() - INTERVAL '${5 - i} days' + INTERVAL '4 hours', 'completed') RETURNING id`,
        [organizationId, opp2Id, `Edu Challenge Day ${i+1}`]
      );
      await client.query(
        `INSERT INTO attendance (event_id, volunteer_id, status, hours, notes, verification_status, verified_at, verified_by)
         VALUES ($1, $2, 'attended', 4, '5 days challenge day', 'verified', NOW(), $3)`,
        [evRes.rows[0].id, volunteerId, orgUserId]
      );
    }

    // Insert 2 certificates
    await client.query(
      `INSERT INTO certificates (volunteer_id, opportunity_id, certificate_number, title, hours, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [volunteerId, opp1Id, 'CERT-DEMO-001', 'Certificate of Volunteer Service', 20, orgUserId]
    );
    await client.query(
      `INSERT INTO certificates (volunteer_id, opportunity_id, certificate_number, title, hours, issued_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [volunteerId, opp2Id, 'CERT-DEMO-002', 'Certificate of Volunteer Service', 20, orgUserId]
    );

    // 5. Create some remaining tasks
    const remainingOppRes = await client.query(
      `INSERT INTO opportunities (organization_id, title, description, category, capacity, start_date, end_date, hours_estimate, status) 
       VALUES ($1, $2, $3, $4, $5, CURRENT_DATE + INTERVAL '2 days', CURRENT_DATE + INTERVAL '20 days', 5, 'open') RETURNING id`,
      [organizationId, 'Upcoming Community Help', 'Help out in the community', 'Community', 10]
    );
    const remOppId = remainingOppRes.rows[0].id;
    for (let i = 0; i < 3; i++) {
      const evRes = await client.query(
        `INSERT INTO events (organization_id, opportunity_id, title, start_at, end_at, status) 
         VALUES ($1, $2, $3, NOW() + INTERVAL '${2 + i} days', NOW() + INTERVAL '${2 + i} days' + INTERVAL '2 hours', 'scheduled') RETURNING id`,
        [organizationId, remOppId, `Community Day ${i+1}`]
      );
      await client.query(
        `INSERT INTO attendance (event_id, volunteer_id, status)
         VALUES ($1, $2, 'assigned')`,
        [evRes.rows[0].id, volunteerId]
      );
    }

    await client.query('COMMIT');
    console.log('Demo setup complete! Email: demo_volunteer@example.com, Password: Password123!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in demo setup:', err);
  } finally {
    client.release();
  }
}

run().catch(console.error).finally(() => pool.end());
