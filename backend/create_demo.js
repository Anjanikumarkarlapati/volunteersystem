import { query } from './src/config/db.js';
import bcrypt from 'bcryptjs';

async function run() {
  try {
    const password = await bcrypt.hash('demo123', 10);
    const userId = '11111111-1111-1111-1111-111111111111';
    
    // Check if exists
    const userRes = await query('SELECT id FROM users WHERE email = $1', ['demo@volunteer.com']);
    if (userRes.rows.length === 0) {
      await query(`INSERT INTO users (id, name, email, password_hash, role) VALUES ($1, 'Demo Volunteer', 'demo@volunteer.com', $2, 'volunteer')`, [userId, password]);
      console.log('User created.');
      
      const volId = '22222222-2222-2222-2222-222222222222';
      await query(`INSERT INTO volunteers (id, user_id, skills, location, total_hours) VALUES ($1, $2, ARRAY['teaching'], 'New York', 40)`, [volId, userId]);
      console.log('Volunteer profile created.');
      
      // Get an opportunity
      const oppRes = await query('SELECT id, title, organization_id FROM opportunities LIMIT 1');
      if (oppRes.rows.length > 0) {
        const opp = oppRes.rows[0];
        
        // Generate 2 certificates
        await query(`INSERT INTO certificates (volunteer_id, opportunity_id, certificate_number, title, hours, issued_by, file_url) VALUES 
          ($1, $2, 'CERT-2026-DEMO1', 'Certificate of Excellence', 20, $3, '/dummy1.pdf'),
          ($1, $2, 'CERT-2026-DEMO2', 'Certificate of Participation', 20, $3, '/dummy2.pdf')`,
          [volId, opp.id, userId]);
        console.log('2 Certificates created.');
        
        // Create 5 daily events for this user
        for (let i = 0; i < 5; i++) {
          const evRes = await query(`INSERT INTO events (opportunity_id, organization_id, created_by, title, description, start_at, end_at, capacity, status) 
            VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${i} days', NOW() + INTERVAL '${i} days' + INTERVAL '4 hours', 1, 'scheduled') RETURNING id`,
            [opp.id, opp.organization_id, userId, `Day ${i+1} Task: ${opp.title}`, 'Daily task']);
          
          await query(`INSERT INTO attendance (event_id, volunteer_id, status, notes) VALUES ($1, $2, 'assigned', '5 days')`,
            [evRes.rows[0].id, volId]);
        }
        console.log('5 Daily Tasks assigned.');
      }
    } else {
      console.log('User already exists.');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
