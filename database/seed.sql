TRUNCATE TABLE
  activity_logs,
  notifications,
  certificates,
  attendance,
  events,
  applications,
  opportunities,
  organizations,
  volunteers,
  users
RESTART IDENTITY CASCADE;

-- Demo passwords:
--   admin@volunteerhub.test        Admin123!
--   maya.volunteer@test            Volunteer123!
--   liam.volunteer@test            Volunteer123!
--   hello@greenfuture.test         Org123!
--   ops@citycare.test              Org123!

INSERT INTO users (id, name, email, password_hash, role, status, last_login_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Platform Admin', 'admin@volunteerhub.test', crypt('Admin123!', gen_salt('bf', 10)), 'admin', 'active', NOW() - INTERVAL '1 day'),
  ('00000000-0000-0000-0000-000000000101', 'Maya Chen', 'maya.volunteer@test', crypt('Volunteer123!', gen_salt('bf', 10)), 'volunteer', 'active', NOW() - INTERVAL '3 hours'),
  ('00000000-0000-0000-0000-000000000102', 'Liam Johnson', 'liam.volunteer@test', crypt('Volunteer123!', gen_salt('bf', 10)), 'volunteer', 'active', NOW() - INTERVAL '2 days'),
  ('00000000-0000-0000-0000-000000000201', 'Green Future Network', 'hello@greenfuture.test', crypt('Org123!', gen_salt('bf', 10)), 'organization', 'active', NOW() - INTERVAL '4 hours'),
  ('00000000-0000-0000-0000-000000000202', 'CityCare Outreach', 'ops@citycare.test', crypt('Org123!', gen_salt('bf', 10)), 'organization', 'active', NOW() - INTERVAL '5 hours');

INSERT INTO volunteers (
  id, user_id, phone, location, bio, skills, interests, availability, total_hours,
  volunteer_type, institution, field_of_study, linkedin_url, github_url
)
VALUES
  (
    '10000000-0000-0000-0000-000000000101',
    '00000000-0000-0000-0000-000000000101',
    '+1 555-0101',
    'Austin, TX',
    'Community organizer with experience in youth mentoring and event logistics.',
    ARRAY['mentoring', 'event planning', 'first aid'],
    ARRAY['education', 'environment', 'community'],
    '{"weekdays":["evening"],"weekends":["morning","afternoon"],"remote":true}'::jsonb,
    30,
    'student',
    'Austin Community College',
    'Public Health',
    'https://linkedin.example/maya',
    NULL
  ),
  (
    '10000000-0000-0000-0000-000000000102',
    '00000000-0000-0000-0000-000000000102',
    '+1 555-0102',
    'Denver, CO',
    'Designer and photographer who supports local food security programs.',
    ARRAY['photography', 'design', 'social media'],
    ARRAY['food security', 'arts', 'fundraising'],
    '{"weekdays":["morning"],"weekends":["afternoon"],"remote":false}'::jsonb,
    0,
    'professional',
    'Freelance Studio',
    NULL,
    'https://linkedin.example/liam',
    NULL
  );

INSERT INTO organizations (id, user_id, name, mission, description, website, contact_phone, address, city, state, country, verified)
VALUES
  (
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'Green Future Network',
    'Restore local ecosystems through hands-on volunteer action.',
    'Green Future Network hosts cleanups, tree planting days, and climate education workshops.',
    'https://greenfuture.example',
    '+1 555-0201',
    '120 River Trail',
    'Austin',
    'TX',
    'United States',
    true
  ),
  (
    '20000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000202',
    'CityCare Outreach',
    'Connect neighbors with food, shelter, and practical support.',
    'CityCare Outreach coordinates meal drives, resource fairs, and neighborhood support teams.',
    'https://citycare.example',
    '+1 555-0202',
    '88 Market Street',
    'Denver',
    'CO',
    'United States',
    true
  );

INSERT INTO opportunities (
  id, organization_id, created_by, title, description, category, required_skills, location,
  is_remote, start_date, end_date, capacity, hours_estimate, latitude, longitude, urgency_level, status
)
VALUES
  (
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup Crew',
    'Help remove litter, sort recyclables, and collect park impact data during a morning cleanup.',
    'Environment',
    ARRAY['teamwork', 'outdoor work'],
    'Austin, TX',
    false,
    CURRENT_DATE + INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '10 days',
    40,
    4,
    30.266900,
    -97.745200,
    'high',
    'open'
  ),
  (
    '30000000-0000-0000-0000-000000000302',
    '20000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000202',
    'Weekend Meal Distribution',
    'Pack and distribute prepared meals to families at three community sites.',
    'Food Security',
    ARRAY['logistics', 'communication'],
    'Denver, CO',
    false,
    CURRENT_DATE + INTERVAL '6 days',
    CURRENT_DATE + INTERVAL '7 days',
    25,
    5,
    39.739600,
    -104.987800,
    'critical',
    'open'
  ),
  (
    '30000000-0000-0000-0000-000000000303',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'Remote Climate Workshop Moderator',
    'Moderate online breakout sessions and help attendees find follow-up volunteer pathways.',
    'Education',
    ARRAY['facilitation', 'remote support'],
    'Remote',
    true,
    CURRENT_DATE + INTERVAL '18 days',
    CURRENT_DATE + INTERVAL '18 days',
    8,
    3,
    30.270200,
    -97.741100,
    'normal',
    'open'
  ),
  (
    '30000000-0000-0000-0000-000000000304',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'Neighborhood Tree Planting',
    'Plant shade trees, prepare mulch rings, and record new planting sites for follow-up care.',
    'environment',
    ARRAY['gardening', 'teamwork'],
    'Austin, TX',
    false,
    CURRENT_DATE + INTERVAL '4 days',
    CURRENT_DATE + INTERVAL '4 days',
    30,
    3,
    30.277400,
    -97.750000,
    'normal',
    'open'
  ),
  (
    '30000000-0000-0000-0000-000000000305',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'Park Trail Welcome Desk',
    'Welcome visitors, hand out cleanup kits, and guide new volunteers to crew leads.',
    'community',
    ARRAY['communication', 'event support'],
    'Austin, TX',
    false,
    CURRENT_DATE + INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '2 days',
    12,
    2,
    30.247900,
    -97.771100,
    'low',
    'open'
  ),
  (
    '30000000-0000-0000-0000-000000000306',
    '20000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000202',
    'Community Pantry Sorting',
    'Sort donated groceries, prepare family boxes, and update pantry inventory sheets.',
    'community',
    ARRAY['organization', 'lifting', 'inventory'],
    'Denver, CO',
    false,
    CURRENT_DATE + INTERVAL '8 days',
    CURRENT_DATE + INTERVAL '8 days',
    18,
    3,
    39.743300,
    -104.994500,
    'high',
    'open'
  );

INSERT INTO applications (id, opportunity_id, volunteer_id, status, message, review_notes, reviewed_by, reviewed_at)
VALUES
  (
    '40000000-0000-0000-0000-000000000401',
    '30000000-0000-0000-0000-000000000301',
    '10000000-0000-0000-0000-000000000101',
    'approved',
    'I can bring first-aid supplies and help check in volunteers.',
    'Strong fit for crew support.',
    '00000000-0000-0000-0000-000000000201',
    NOW() - INTERVAL '1 day'
  ),
  (
    '40000000-0000-0000-0000-000000000402',
    '30000000-0000-0000-0000-000000000302',
    '10000000-0000-0000-0000-000000000102',
    'pending',
    'I can help with social media photos and packing.',
    NULL,
    NULL,
    NULL
  );

INSERT INTO events (id, opportunity_id, organization_id, created_by, title, description, location, start_at, end_at, capacity, status)
VALUES
  (
    '50000000-0000-0000-0000-000000000501',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup - South Bank',
    'Meet at the South Bank pavilion for supplies and safety briefing.',
    'South Bank Pavilion, Austin, TX',
    NOW() + INTERVAL '10 days',
    NOW() + INTERVAL '10 days 4 hours',
    40,
    'scheduled'
  ),
  (
    '50000000-0000-0000-0000-000000000502',
    '30000000-0000-0000-0000-000000000302',
    '20000000-0000-0000-0000-000000000202',
    '00000000-0000-0000-0000-000000000202',
    'Meal Distribution - Central Site',
    'Pack meals, welcome families, and record inventory counts.',
    'Central Community Kitchen, Denver, CO',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '5 hours',
    25,
    'completed'
  ),
  (
    '50000000-0000-0000-0000-000000000503',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup 5-Day Challenge - Day 1',
    'Complete 5 days of river cleanup to earn your certificate.',
    'South Bank Pavilion, Austin, TX',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '4 hours',
    40,
    'completed'
  ),
  (
    '50000000-0000-0000-0000-000000000504',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup 5-Day Challenge - Day 2',
    'Complete 5 days of river cleanup to earn your certificate.',
    'South Bank Pavilion, Austin, TX',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days' + INTERVAL '4 hours',
    40,
    'completed'
  ),
  (
    '50000000-0000-0000-0000-000000000505',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup 5-Day Challenge - Day 3',
    'Complete 5 days of river cleanup to earn your certificate.',
    'South Bank Pavilion, Austin, TX',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '4 hours',
    40,
    'completed'
  ),
  (
    '50000000-0000-0000-0000-000000000506',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup 5-Day Challenge - Day 4',
    'Complete 5 days of river cleanup to earn your certificate.',
    'South Bank Pavilion, Austin, TX',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '4 hours',
    40,
    'completed'
  ),
  (
    '50000000-0000-0000-0000-000000000507',
    '30000000-0000-0000-0000-000000000301',
    '20000000-0000-0000-0000-000000000201',
    '00000000-0000-0000-0000-000000000201',
    'River Cleanup 5-Day Challenge - Day 5',
    'Complete 5 days of river cleanup to earn your certificate.',
    'South Bank Pavilion, Austin, TX',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '4 hours',
    40,
    'completed'
  );

INSERT INTO attendance (id, event_id, volunteer_id, check_in_at, check_out_at, hours, status, verification_status, verified_at, verified_by, notes)
VALUES
  (
    '60000000-0000-0000-0000-000000000601',
    '50000000-0000-0000-0000-000000000501',
    '10000000-0000-0000-0000-000000000101',
    NULL,
    NULL,
    0,
    'assigned',
    'pending',
    NULL,
    NULL,
    'Approved application converted to event assignment.'
  ),
  (
    '60000000-0000-0000-0000-000000000602',
    '50000000-0000-0000-0000-000000000502',
    '10000000-0000-0000-0000-000000000102',
    NOW() - INTERVAL '14 days',
    NOW() - INTERVAL '14 days' + INTERVAL '5 hours',
    5,
    'attended',
    'verified',
    NOW() - INTERVAL '13 days',
    '00000000-0000-0000-0000-000000000202',
    'Supported packing station and photos.'
  ),
  -- 5-day challenge for Maya (volunteer 101)
  (
    '60000000-0000-0000-0000-000000000603',
    '50000000-0000-0000-0000-000000000503',
    '10000000-0000-0000-0000-000000000101',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days' + INTERVAL '4 hours',
    4,
    'attended',
    'verified',
    NOW() - INTERVAL '9 days',
    '00000000-0000-0000-0000-000000000201',
    'Day 1: River Cleanup - 5 day challenge'
  ),
  (
    '60000000-0000-0000-0000-000000000604',
    '50000000-0000-0000-0000-000000000504',
    '10000000-0000-0000-0000-000000000101',
    NOW() - INTERVAL '9 days',
    NOW() - INTERVAL '9 days' + INTERVAL '4 hours',
    4,
    'attended',
    'verified',
    NOW() - INTERVAL '8 days',
    '00000000-0000-0000-0000-000000000201',
    'Day 2: River Cleanup - 5 day challenge'
  ),
  (
    '60000000-0000-0000-0000-000000000605',
    '50000000-0000-0000-0000-000000000505',
    '10000000-0000-0000-0000-000000000101',
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '8 days' + INTERVAL '4 hours',
    4,
    'attended',
    'verified',
    NOW() - INTERVAL '7 days',
    '00000000-0000-0000-0000-000000000201',
    'Day 3: River Cleanup - 5 day challenge'
  ),
  (
    '60000000-0000-0000-0000-000000000606',
    '50000000-0000-0000-0000-000000000506',
    '10000000-0000-0000-0000-000000000101',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '4 hours',
    4,
    'attended',
    'verified',
    NOW() - INTERVAL '6 days',
    '00000000-0000-0000-0000-000000000201',
    'Day 4: River Cleanup - 5 day challenge'
  ),
  (
    '60000000-0000-0000-0000-000000000607',
    '50000000-0000-0000-0000-000000000507',
    '10000000-0000-0000-0000-000000000101',
    NOW() - INTERVAL '6 days',
    NOW() - INTERVAL '6 days' + INTERVAL '4 hours',
    4,
    'attended',
    'verified',
    NOW() - INTERVAL '5 days',
    '00000000-0000-0000-0000-000000000201',
    'Day 5: River Cleanup - 5 day challenge'
  );

INSERT INTO certificates (id, volunteer_id, event_id, opportunity_id, certificate_number, title, hours, issued_by, file_url, metadata)
VALUES
  (
    '70000000-0000-0000-0000-000000000701',
    '10000000-0000-0000-0000-000000000102',
    '50000000-0000-0000-0000-000000000502',
    '30000000-0000-0000-0000-000000000302',
    'CERT-2026-0001',
    'Certificate of Volunteer Service',
    5,
    '00000000-0000-0000-0000-000000000202',
    '/uploads/certificates/CERT-2026-0001.pdf',
    '{"achievement":"Completed meal distribution support"}'::jsonb
  ),
  (
    '70000000-0000-0000-0000-000000000702',
    '10000000-0000-0000-0000-000000000101',
    '50000000-0000-0000-0000-000000000503',
    '30000000-0000-0000-0000-000000000301',
    'CERT-2026-0002',
    'Certificate of Volunteer Service - 5 Day Challenge',
    20,
    '00000000-0000-0000-0000-000000000201',
    '/uploads/certificates/CERT-2026-0002.pdf',
    '{"achievement":"Completed 5-day River Cleanup Challenge (20 hours)", "fiveDayCompletion": true}'::jsonb
  ),
  (
    '70000000-0000-0000-0000-000000000703',
    '10000000-0000-0000-0000-000000000101',
    '50000000-0000-0000-0000-000000000502',
    '30000000-0000-0000-0000-000000000302',
    'CERT-2026-0003',
    'Certificate of Volunteer Service',
    5,
    '00000000-0000-0000-0000-000000000202',
    '/uploads/certificates/CERT-2026-0003.pdf',
    '{"achievement":"Assisted with Meal Distribution support"}'::jsonb
  );

INSERT INTO notifications (user_id, title, message, type, metadata)
VALUES
  ('00000000-0000-0000-0000-000000000101', 'Application approved', 'You were approved for River Cleanup Crew.', 'application', '{"applicationId":"40000000-0000-0000-0000-000000000401"}'::jsonb),
  ('00000000-0000-0000-0000-000000000102', 'Certificate issued', 'Your certificate for Weekend Meal Distribution is ready.', 'certificate', '{"certificateNumber":"CERT-2026-0001"}'::jsonb),
  ('00000000-0000-0000-0000-000000000201', 'New application received', 'Maya Chen applied to River Cleanup Crew.', 'application', '{"opportunityId":"30000000-0000-0000-0000-000000000301"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', 'Certificate issued', 'Your certificate for 5-Day River Cleanup Challenge is ready.', 'certificate', '{"certificateNumber":"CERT-2026-0002"}'::jsonb),
  ('00000000-0000-0000-0000-000000000101', 'Certificate issued', 'Your certificate for Meal Distribution support is ready.', 'certificate', '{"certificateNumber":"CERT-2026-0003"}'::jsonb);

INSERT INTO activity_logs (actor_user_id, action, entity_type, entity_id, ip_address, user_agent, metadata)
VALUES
  ('00000000-0000-0000-0000-000000000201', 'application.approved', 'applications', '40000000-0000-0000-0000-000000000401', '127.0.0.1', 'seed', '{"source":"seed"}'::jsonb),
  ('00000000-0000-0000-0000-000000000202', 'certificate.issued', 'certificates', '70000000-0000-0000-0000-000000000701', '127.0.0.1', 'seed', '{"source":"seed"}'::jsonb),
  ('00000000-0000-0000-0000-000000000201', 'certificate.issued', 'certificates', '70000000-0000-0000-0000-000000000702', '127.0.0.1', 'seed', '{"source":"seed"}'::jsonb),
  ('00000000-0000-0000-0000-000000000202', 'certificate.issued', 'certificates', '70000000-0000-0000-0000-000000000703', '127.0.0.1', 'seed', '{"source":"seed"}'::jsonb);
