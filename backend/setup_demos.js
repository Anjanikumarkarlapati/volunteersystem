/**
 * Comprehensive Demo Account Setup Script
 * Creates/updates all 3 demo accounts with rich data:
 *   Admin:        admin@volunteerhub.com / Admin@123
 *   Organization: org@volunteerhub.com   / Org@123
 *   Volunteer:    volunteer@volunteerhub.com / Vol@123
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* ─── 1. Admin Demo Account ──────────────────────────── */
    const adminEmail = 'admin@volunteerhub.com';
    const adminPass = await bcrypt.hash('Admin@123', 10);
    let adminRes = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    let adminId;
    if (adminRes.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO users (email, password_hash, name, role, status)
         VALUES ($1, $2, 'Admin User', 'admin', 'active') RETURNING id`,
        [adminEmail, adminPass]
      );
      adminId = r.rows[0].id;
      console.log('✅ Admin created:', adminEmail);
    } else {
      adminId = adminRes.rows[0].id;
      await client.query('UPDATE users SET password_hash=$1, name=$2, status=$3 WHERE id=$4',
        [adminPass, 'Admin User', 'active', adminId]);
      console.log('✅ Admin updated:', adminEmail);
    }

    /* ─── 2. Organization Demo Account ──────────────────── */
    const orgEmail = 'org@volunteerhub.com';
    const orgPass = await bcrypt.hash('Org@123', 10);
    let orgRes = await client.query('SELECT id FROM users WHERE email = $1', [orgEmail]);
    let orgUserId;
    if (orgRes.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO users (email, password_hash, name, role, status)
         VALUES ($1, $2, 'GreenFuture NGO', 'organization', 'active') RETURNING id`,
        [orgEmail, orgPass]
      );
      orgUserId = r.rows[0].id;
    } else {
      orgUserId = orgRes.rows[0].id;
      await client.query('UPDATE users SET password_hash=$1, name=$2, status=$3 WHERE id=$4',
        [orgPass, 'GreenFuture NGO', 'active', orgUserId]);
    }

    // Ensure org profile exists
    let orgProfileRes = await client.query('SELECT id FROM organizations WHERE user_id = $1', [orgUserId]);
    let organizationId;
    if (orgProfileRes.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO organizations (user_id, name, city, state, description, verified)
         VALUES ($1, 'GreenFuture NGO', 'Hyderabad', 'Telangana', 'Creating a greener tomorrow through community action.', true) RETURNING id`,
        [orgUserId]
      );
      organizationId = r.rows[0].id;
    } else {
      organizationId = orgProfileRes.rows[0].id;
      await client.query(
        `UPDATE organizations SET name='GreenFuture NGO', city='Hyderabad', state='Telangana', verified=true WHERE id=$1`,
        [organizationId]
      );
    }
    console.log('✅ Organization demo ready:', orgEmail);

    /* ─── 3. Volunteer Demo Account ─────────────────────── */
    const volEmail = 'volunteer@volunteerhub.com';
    const volPass = await bcrypt.hash('Vol@123', 10);
    let volUserRes = await client.query('SELECT id FROM users WHERE email = $1', [volEmail]);
    let volUserId;
    if (volUserRes.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO users (email, password_hash, name, role, status)
         VALUES ($1, $2, 'Alex Volunteer', 'volunteer', 'active') RETURNING id`,
        [volEmail, volPass]
      );
      volUserId = r.rows[0].id;
    } else {
      volUserId = volUserRes.rows[0].id;
      await client.query('UPDATE users SET password_hash=$1, name=$2, status=$3 WHERE id=$4',
        [volPass, 'Alex Volunteer', 'active', volUserId]);
    }

    // Ensure volunteer profile exists
    let volProfileRes = await client.query('SELECT id FROM volunteers WHERE user_id = $1', [volUserId]);
    let volunteerId;
    if (volProfileRes.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO volunteers (user_id, location, bio, skills, interests, volunteer_type, institution, field_of_study, total_hours)
         VALUES ($1, 'Hyderabad, Telangana',
           'Passionate about making a difference in the community through environmental and education initiatives.',
           ARRAY['teaching','public speaking','project management','data analysis'],
           ARRAY['environment','education','community'],
           'student', 'IIIT Hyderabad', 'Computer Science', 40)
         RETURNING id`,
        [volUserId]
      );
      volunteerId = r.rows[0].id;
    } else {
      volunteerId = volProfileRes.rows[0].id;
      await client.query(
        `UPDATE volunteers SET
           location='Hyderabad, Telangana',
           bio='Passionate about making a difference in the community through environmental and education initiatives.',
           skills=ARRAY['teaching','public speaking','project management','data analysis'],
           interests=ARRAY['environment','education','community'],
           volunteer_type='student',
           institution='IIIT Hyderabad',
           field_of_study='Computer Science',
           total_hours=40
         WHERE id=$1`,
        [volunteerId]
      );
    }
    console.log('✅ Volunteer demo ready:', volEmail);

    /* ─── 4. Create Rich Opportunities ──────────────────── */
    // Opportunity 1: Environment (completed)
    let opp1Id;
    const opp1Check = await client.query(
      `SELECT id FROM opportunities WHERE title = 'City Clean-Up Drive' AND organization_id = $1`,
      [organizationId]
    );
    if (opp1Check.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO opportunities (organization_id, title, description, category, capacity, location,
           start_date, end_date, hours_estimate, status, required_skills)
         VALUES ($1, 'City Clean-Up Drive',
           'Join us for a massive city-wide clean-up initiative. Volunteers will collect waste, plant saplings, and raise awareness about environmental hygiene.',
           'Environment', 20, 'Hyderabad, Telangana',
           CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '5 days',
           20, 'open', ARRAY['teamwork','physical fitness']) RETURNING id`,
        [organizationId]
      );
      opp1Id = r.rows[0].id;
    } else {
      opp1Id = opp1Check.rows[0].id;
    }

    // Opportunity 2: Education (active)
    let opp2Id;
    const opp2Check = await client.query(
      `SELECT id FROM opportunities WHERE title = 'Digital Literacy for Seniors' AND organization_id = $1`,
      [organizationId]
    );
    if (opp2Check.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO opportunities (organization_id, title, description, category, capacity, location,
           start_date, end_date, hours_estimate, status, required_skills)
         VALUES ($1, 'Digital Literacy for Seniors',
           'Teach senior citizens how to use smartphones, video calls, and internet safely. Make technology accessible to all ages.',
           'Education', 15, 'Secunderabad, Telangana',
           CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '20 days',
           10, 'open', ARRAY['teaching','patience','communication']) RETURNING id`,
        [organizationId]
      );
      opp2Id = r.rows[0].id;
    } else {
      opp2Id = opp2Check.rows[0].id;
    }

    // Opportunity 3: Community (upcoming - needs admin approval to test)
    let opp3Id;
    const opp3Check = await client.query(
      `SELECT id FROM opportunities WHERE title = 'Food Distribution Drive' AND organization_id = $1`,
      [organizationId]
    );
    if (opp3Check.rows.length === 0) {
      const r = await client.query(
        `INSERT INTO opportunities (organization_id, title, description, category, capacity, location,
           start_date, end_date, hours_estimate, status, required_skills)
         VALUES ($1, 'Food Distribution Drive',
           'Help distribute nutritious meals to underprivileged families in low-income neighborhoods every weekend.',
           'Community', 30, 'Kukatpally, Hyderabad',
           CURRENT_DATE + INTERVAL '3 days', CURRENT_DATE + INTERVAL '30 days',
           5, 'open', ARRAY['coordination','communication']) RETURNING id`,
        [organizationId]
      );
      opp3Id = r.rows[0].id;
    } else {
      opp3Id = opp3Check.rows[0].id;
    }

    // Opportunity 4: pending approval (for admin approvals page)
    const opp4Check = await client.query(
      `SELECT id FROM opportunities WHERE title = 'Tree Plantation Weekend' AND organization_id = $1`,
      [organizationId]
    );
    if (opp4Check.rows.length === 0) {
      await client.query(
        `INSERT INTO opportunities (organization_id, title, description, category, capacity, location,
           start_date, end_date, hours_estimate, status)
         VALUES ($1, 'Tree Plantation Weekend',
           'A weekend-long event to plant 500 trees across the city parks. Join our Green Heroes programme.',
           'Environment', 50, 'Jubilee Hills, Hyderabad',
           CURRENT_DATE + INTERVAL '7 days', CURRENT_DATE + INTERVAL '8 days',
           8, 'pending')`,
        [organizationId]
      );
      console.log('✅ Pending opportunity created for admin approvals');
    }

    /* ─── 5. Create Events for each opportunity ──────────── */
    // 5 completed events for opp1 (past, all attended by demo volunteer)
    for (let i = 0; i < 5; i++) {
      const evCheck = await client.query(
        `SELECT id FROM events WHERE title = $1 AND opportunity_id = $2`,
        [`City Clean-Up Day ${i + 1}`, opp1Id]
      );
      let evId;
      if (evCheck.rows.length === 0) {
        const evR = await client.query(
          `INSERT INTO events (organization_id, opportunity_id, title, description, location,
             start_at, end_at, capacity, status)
           VALUES ($1, $2, $3, 'Daily clean-up shift for volunteers', 'Hyderabad Parks',
             NOW() - INTERVAL '${10 - i} days',
             NOW() - INTERVAL '${10 - i} days' + INTERVAL '4 hours',
             20, 'completed') RETURNING id`,
          [organizationId, opp1Id, `City Clean-Up Day ${i + 1}`]
        );
        evId = evR.rows[0].id;

        // Assign and mark as attended
        const attCheck = await client.query(
          `SELECT id FROM attendance WHERE event_id = $1 AND volunteer_id = $2`,
          [evId, volunteerId]
        );
        if (attCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO attendance (event_id, volunteer_id, status, hours, notes, verification_status, verified_at, verified_by)
             VALUES ($1, $2, 'attended', 4, 'Excellent participation', 'verified', NOW(), $3)`,
            [evId, volunteerId, orgUserId]
          );
        }
      }
    }

    // 5 completed events for opp2 (past, all attended)
    for (let i = 0; i < 5; i++) {
      const evCheck = await client.query(
        `SELECT id FROM events WHERE title = $1 AND opportunity_id = $2`,
        [`Digital Literacy Session ${i + 1}`, opp2Id]
      );
      if (evCheck.rows.length === 0) {
        const evR = await client.query(
          `INSERT INTO events (organization_id, opportunity_id, title, description, location,
             start_at, end_at, capacity, status)
           VALUES ($1, $2, $3, 'Training session for senior citizens', 'Community Center',
             NOW() - INTERVAL '${5 - i} days',
             NOW() - INTERVAL '${5 - i} days' + INTERVAL '3 hours',
             15, 'completed') RETURNING id`,
          [organizationId, opp2Id, `Digital Literacy Session ${i + 1}`]
        );
        const evId = evR.rows[0].id;
        const attCheck = await client.query(
          `SELECT id FROM attendance WHERE event_id = $1 AND volunteer_id = $2`,
          [evId, volunteerId]
        );
        if (attCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO attendance (event_id, volunteer_id, status, hours, notes, verification_status, verified_at, verified_by)
             VALUES ($1, $2, 'attended', 3, 'Great teaching skills', 'verified', NOW(), $3)`,
            [evId, volunteerId, orgUserId]
          );
        }
      }
    }

    // 3 upcoming events for opp3 (assigned to demo volunteer)
    for (let i = 0; i < 3; i++) {
      const evCheck = await client.query(
        `SELECT id FROM events WHERE title = $1 AND opportunity_id = $2`,
        [`Food Drive Day ${i + 1}`, opp3Id]
      );
      if (evCheck.rows.length === 0) {
        const evR = await client.query(
          `INSERT INTO events (organization_id, opportunity_id, title, description, location,
             start_at, end_at, capacity, status)
           VALUES ($1, $2, $3, 'Weekend food distribution', 'Kukatpally Distribution Center',
             NOW() + INTERVAL '${3 + i * 7} days',
             NOW() + INTERVAL '${3 + i * 7} days' + INTERVAL '5 hours',
             30, 'scheduled') RETURNING id`,
          [organizationId, opp3Id, `Food Drive Day ${i + 1}`]
        );
        const evId = evR.rows[0].id;
        const attCheck = await client.query(
          `SELECT id FROM attendance WHERE event_id = $1 AND volunteer_id = $2`,
          [evId, volunteerId]
        );
        if (attCheck.rows.length === 0) {
          await client.query(
            `INSERT INTO attendance (event_id, volunteer_id, status) VALUES ($1, $2, 'assigned')`,
            [evId, volunteerId]
          );
        }
      }
    }

    /* ─── 6. Applications ────────────────────────────────── */
    // Approved application for opp1
    const app1Check = await client.query(
      `SELECT id FROM applications WHERE volunteer_id=$1 AND opportunity_id=$2`,
      [volunteerId, opp1Id]
    );
    if (app1Check.rows.length === 0) {
      await client.query(
        `INSERT INTO applications (volunteer_id, opportunity_id, status, message, applied_at)
         VALUES ($1, $2, 'approved', 'I am passionate about the environment and would love to help.', NOW() - INTERVAL '20 days')`,
        [volunteerId, opp1Id]
      );
    }

    // Approved application for opp2
    const app2Check = await client.query(
      `SELECT id FROM applications WHERE volunteer_id=$1 AND opportunity_id=$2`,
      [volunteerId, opp2Id]
    );
    if (app2Check.rows.length === 0) {
      await client.query(
        `INSERT INTO applications (volunteer_id, opportunity_id, status, message, applied_at)
         VALUES ($1, $2, 'approved', 'I have experience teaching and would love to help seniors.', NOW() - INTERVAL '8 days')`,
        [volunteerId, opp2Id]
      );
    }

    // Pending application for opp3
    const app3Check = await client.query(
      `SELECT id FROM applications WHERE volunteer_id=$1 AND opportunity_id=$2`,
      [volunteerId, opp3Id]
    );
    if (app3Check.rows.length === 0) {
      await client.query(
        `INSERT INTO applications (volunteer_id, opportunity_id, status, message, applied_at)
         VALUES ($1, $2, 'pending', 'I want to help distribute food to those in need.', NOW() - INTERVAL '1 day')`,
        [volunteerId, opp3Id]
      );
    }

    /* ─── 7. Certificates ────────────────────────────────── */
    const cert1Check = await client.query(
      `SELECT id FROM certificates WHERE volunteer_id=$1 AND certificate_number='CERT-DEMO-ENV-001'`,
      [volunteerId]
    );
    if (cert1Check.rows.length === 0) {
      await client.query(
        `INSERT INTO certificates (volunteer_id, opportunity_id, certificate_number, title, hours, issued_by, issued_at)
         VALUES ($1, $2, 'CERT-DEMO-ENV-001', 'Certificate of Environmental Service', 20, $3, NOW() - INTERVAL '5 days')`,
        [volunteerId, opp1Id, orgUserId]
      );
    }

    const cert2Check = await client.query(
      `SELECT id FROM certificates WHERE volunteer_id=$1 AND certificate_number='CERT-DEMO-EDU-002'`,
      [volunteerId]
    );
    if (cert2Check.rows.length === 0) {
      await client.query(
        `INSERT INTO certificates (volunteer_id, opportunity_id, certificate_number, title, hours, issued_by, issued_at)
         VALUES ($1, $2, 'CERT-DEMO-EDU-002', 'Certificate of Educational Service', 15, $3, NOW() - INTERVAL '1 day')`,
        [volunteerId, opp2Id, orgUserId]
      );
    }

    /* ─── 8. Update total_hours on volunteer ──────────────── */
    await client.query(
      `UPDATE volunteers SET total_hours = (
         SELECT COALESCE(SUM(hours), 0) FROM attendance WHERE volunteer_id = $1 AND status = 'attended'
       ) WHERE id = $1`,
      [volunteerId]
    );

    /* ─── 9. Notifications (read_at=null means unread) ──── */
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT $1, 'Welcome to Volunteer Hub!', 'Your account is set up. Start exploring opportunities!', 'info'
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=$1 AND title='Welcome to Volunteer Hub!')`,
      [volUserId]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT $1, 'Application Approved!', 'Your application for City Clean-Up Drive has been approved.', 'success'
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=$1 AND title='Application Approved!')`,
      [volUserId]
    );
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT $1, 'Certificate Issued!', 'You have received a Certificate of Environmental Service.', 'success'
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=$1 AND title='Certificate Issued!')`,
      [volUserId]
    );
    // Org notifications
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT $1, 'New Application Received!', 'A volunteer applied to your City Clean-Up Drive.', 'info'
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=$1 AND title='New Application Received!')`,
      [orgUserId]
    );
    // Admin notifications
    await client.query(
      `INSERT INTO notifications (user_id, title, message, type)
       SELECT $1, 'New Pending Approval', 'A new opportunity is pending your review: Tree Plantation Weekend.', 'info'
       WHERE NOT EXISTS (SELECT 1 FROM notifications WHERE user_id=$1 AND title='New Pending Approval')`,
      [adminId]
    );

    await client.query('COMMIT');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('🎉 DEMO SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📋 DEMO ACCOUNTS:');
    console.log('');
    console.log('  👨‍💼 ADMIN');
    console.log('     Email:    admin@volunteerhub.com');
    console.log('     Password: Admin@123');
    console.log('');
    console.log('  🏢 ORGANIZATION');
    console.log('     Email:    org@volunteerhub.com');
    console.log('     Password: Org@123');
    console.log('     Name:     GreenFuture NGO');
    console.log('');
    console.log('  🙋 VOLUNTEER');
    console.log('     Email:    volunteer@volunteerhub.com');
    console.log('     Password: Vol@123');
    console.log('     Name:     Alex Volunteer');
    console.log('     Hours:    40 hrs');
    console.log('     Events:   10 completed + 3 upcoming');
    console.log('     Certs:    2 certificates');
    console.log('═══════════════════════════════════════════════════');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', err.message);
    console.error(err.stack);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
