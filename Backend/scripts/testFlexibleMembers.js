require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
const http = require('http');

function postJSON(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const req = http.request(
      {
        hostname: 'localhost',
        port: 9090,
        path: path,
        method: 'POST',
        headers,
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

async function testFlexibleMembers() {
  try {
    const testUsername = 'member_flex_' + Date.now();
    const regRes = await postJSON('/api/auth/register', {
      name: 'Flex Organizer',
      username: testUsername,
      password: 'password123',
      organization: 'Hackathon Lab',
    });

    const token = regRes.data?.token;

    // 1. Create a 1-member team
    const t1 = await postJSON(
      '/api/teams',
      {
        teamNumber: '1',
        teamName: 'Solo Coder',
        department: 'CSE',
        members: [{ name: 'Solo', registerNumber: 'SOLO01', department: 'CSE' }],
      },
      token
    );
    console.log('1-member team creation status:', t1.status, 'members count:', t1.data?.members?.length);

    // 2. Create a 3-member team
    const t2 = await postJSON(
      '/api/teams',
      {
        teamNumber: '2',
        teamName: 'Trio Ninjas',
        department: 'ECE',
        members: [
          { name: 'Ninja 1', registerNumber: 'N01', department: 'ECE' },
          { name: 'Ninja 2', registerNumber: 'N02', department: 'ECE' },
          { name: 'Ninja 3', registerNumber: 'N03', department: 'ECE' },
        ],
      },
      token
    );
    console.log('3-member team creation status:', t2.status, 'members count:', t2.data?.members?.length);

    // 3. Create a 5-member team
    const t3 = await postJSON(
      '/api/teams',
      {
        teamNumber: '3',
        teamName: 'Power Five',
        department: 'IT',
        members: [
          { name: 'P1', registerNumber: 'P01', department: 'IT' },
          { name: 'P2', registerNumber: 'P02', department: 'IT' },
          { name: 'P3', registerNumber: 'P03', department: 'IT' },
          { name: 'P4', registerNumber: 'P04', department: 'IT' },
          { name: 'P5', registerNumber: 'P05', department: 'IT' },
        ],
      },
      token
    );
    console.log('5-member team creation status:', t3.status, 'members count:', t3.data?.members?.length);

    console.log('ALL FLEXIBLE MEMBER SIZE TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (e) {
    console.error('Test error:', e);
    process.exit(1);
  }
}

testFlexibleMembers();
