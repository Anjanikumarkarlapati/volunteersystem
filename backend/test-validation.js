import pg from 'pg';
(async () => {
  const pool = new pg.Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/volunteer_management' });
  
  // Create an org
  const orgRes = await pool.query("INSERT INTO organizations (user_id, name, type) VALUES ((SELECT id FROM users LIMIT 1), 'Test Org', 'nonprofit') RETURNING id");
  const orgId = orgRes.rows[0].id;
  
  // Create pending opportunity
  const oppRes = await pool.query("INSERT INTO opportunities (organization_id, title, description, category, start_date, status) VALUES ($1, 'Test Pending Opp', 'Desc', 'Community', NOW(), 'pending') RETURNING id", [orgId]);
  const oppId = oppRes.rows[0].id;
  
  // Login as admin
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({email: 'admin@volunteerhub.test', password: 'Admin123!'})
  });
  const data = await res.json();
  const token = data.token || data.accessToken;
  
  // Try to approve it
  const patchRes = await fetch('http://localhost:5000/api/admin/opportunities/' + oppId + '/status', {
    method: 'PATCH',
    headers: {'Content-Type': 'application/json', Authorization: 'Bearer ' + token},
    body: JSON.stringify({status: 'open'})
  });
  const patchData = await patchRes.json();
  console.log('PATCH Status:', patchRes.status);
  console.log('PATCH Response:', patchData);
  
  await pool.query("DELETE FROM opportunities WHERE id = $1", [oppId]);
  await pool.query("DELETE FROM organizations WHERE id = $1", [orgId]);
  await pool.end();
})();
