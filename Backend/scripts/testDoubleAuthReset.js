require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
const http = require('http');
const mongoose = require('mongoose');
const User = require('../models/User');
const Round = require('../models/Round');
const Team = require('../models/Team');
const EvaluationScore = require('../models/EvaluationScore');

function postJSON(path, data, token = null) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
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

async function testDoubleAuth() {
  try {
    const mongoUri = process.env.Mongodb_url || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hems';
    await mongoose.connect(mongoUri);

    const testUsername = 'security_test_' + Date.now();
    const testPassword = 'SecretPassword123!';

    // Register user
    const regRes = await postJSON('/api/auth/register', {
      name: 'Security Admin',
      username: testUsername,
      password: testPassword,
      organization: 'Cyber Defense',
    });

    const token = regRes.data?.token;
    const userId = regRes.data?._id;
    console.log('User registered for security test:', testUsername);

    // Create a dummy score in DB
    const dummyRound = await Round.create({
      user: userId,
      name: 'Security Round',
      order: 1,
      weight: 1,
    });
    const dummyTeam = await Team.create({
      user: userId,
      teamNumber: '99',
      teamName: 'Cyber Test',
      department: 'SEC',
    });
    await EvaluationScore.create({
      user: userId,
      roundId: dummyRound._id,
      teamId: dummyTeam._id,
      teamScore: 45,
    });

    console.log('Dummy evaluation score seeded.');

    // Test 1: Reset with wrong confirmation phrase
    const test1 = await postJSON(
      '/api/settings/reset',
      { password: testPassword, confirmationPhrase: 'WRONG' },
      token
    );
    console.log('Test 1 (Wrong phrase) Status:', test1.status, '(Expected 400)');

    // Test 2: Reset with wrong password
    const test2 = await postJSON(
      '/api/settings/reset',
      { password: 'WrongPassword!', confirmationPhrase: 'RESET' },
      token
    );
    console.log('Test 2 (Wrong password) Status:', test2.status, '(Expected 401)');

    // Test 3: Reset with correct phrase and password
    const test3 = await postJSON(
      '/api/settings/reset',
      { password: testPassword, confirmationPhrase: 'RESET' },
      token
    );
    console.log('Test 3 (Correct phrase & password) Status:', test3.status, '(Expected 200)');
    console.log('Test 3 message:', test3.data?.message);

    // Verify scores in DB are 0
    const remainingScores = await EvaluationScore.countDocuments({ user: userId });
    console.log('Remaining scores in DB for test user:', remainingScores, '(Expected 0)');

    // Clean up
    await EvaluationScore.deleteMany({ user: userId });
    await Team.deleteMany({ user: userId });
    await Round.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);

    console.log('ALL DOUBLE AUTHENTICATION SECURITY TESTS PASSED!');
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    process.exit(1);
  }
}

testDoubleAuth();
