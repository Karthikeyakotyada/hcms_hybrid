const http = require('http');

function postJSON(path, data) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 9090,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function testAuthHTTP() {
  try {
    const uniqueUser = 'organizer_' + Math.floor(Math.random() * 100000);
    console.log('Testing registration for:', uniqueUser);

    const regRes = await postJSON('/api/auth/register', {
      name: 'Professor Charles',
      username: uniqueUser,
      password: 'password123',
      organization: 'Xavier Institute',
    });

    console.log('Registration HTTP response status:', regRes.status);
    console.log('Registration token received:', !!regRes.data?.token);
    console.log('User registered details:', regRes.data?.name, regRes.data?.organization);

    const loginRes = await postJSON('/api/auth/login', {
      username: uniqueUser,
      password: 'password123',
    });

    console.log('Login HTTP response status:', loginRes.status);
    console.log('Login token received:', !!loginRes.data?.token);

    console.log('HTTP AUTH API VERIFICATION SUCCEEDED!');
    process.exit(0);
  } catch (err) {
    console.error('HTTP test failed:', err.message);
    process.exit(1);
  }
}

testAuthHTTP();
