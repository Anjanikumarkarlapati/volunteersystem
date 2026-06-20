async function test() {
  try {
    // 1. Get org token
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'demo_org@example.com', password: 'Password123!' })
    });
    const loginData = await loginRes.json();
    console.log('Login:', loginData);
  } catch(e) { console.error(e); }
}

test();
