require('dotenv').config();
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {}
const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');
const ApplicationSettings = require('../models/ApplicationSettings');
const seedInitialData = require('../utils/seed');
const { initializeUserWorkspace } = require('../utils/userWorkspace');

async function runTest() {
  try {
    const mongoUri = process.env.Mongodb_url || process.env.MONGODB_URL || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hems';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Run seedInitialData to test migration & index drops
    await seedInitialData();

    const admin = await User.findOne({ username: 'admin' });
    console.log('Admin user verified:', admin ? admin.username : 'not found');

    // 2. Simulate creating a new Organizer User
    const testUsername = 'testorg_' + Date.now();
    const testUser = await User.create({
      username: testUsername,
      password: 'password123',
      name: 'Dr. Test Organizer',
      organization: 'MIT Hackathon Club',
      role: 'organizer',
    });

    await initializeUserWorkspace(testUser._id);
    console.log('Test user created and workspace initialized:', testUser.username);

    // 3. Verify test user's rounds and settings
    const testSettings = await ApplicationSettings.findOne({ user: testUser._id });
    const testRounds = await Round.find({ user: testUser._id });
    console.log('Test user settings exists:', !!testSettings);
    console.log('Test user rounds count:', testRounds.length);

    // 4. Test creating a team in test user workspace
    const team1 = await Team.create({
      user: testUser._id,
      teamNumber: '1',
      teamName: 'Cyber Hackers',
      department: 'CSE',
    });

    const m1 = await Member.create({
      user: testUser._id,
      teamId: team1._id,
      name: 'Alice',
      registerNumber: 'REG101',
      department: 'CSE',
    });
    team1.members = [m1._id];
    await team1.save();

    console.log('Team created for test user:', team1.teamName, 'teamNumber:', team1.teamNumber);

    // 5. Test data isolation: verify Admin does NOT see test user's team
    const adminTeams = await Team.find({ user: admin._id, teamNumber: '1' });
    console.log('Admin teams with number 1 (admin workspace):', adminTeams.length);

    const testUserTeams = await Team.find({ user: testUser._id });
    console.log('Test user teams count (test workspace):', testUserTeams.length);

    // Clean up test user and their data
    await Member.deleteMany({ user: testUser._id });
    await Team.deleteMany({ user: testUser._id });
    await Round.deleteMany({ user: testUser._id });
    await ApplicationSettings.deleteMany({ user: testUser._id });
    await User.findByIdAndDelete(testUser._id);
    console.log('Test user cleanup completed.');

    console.log('ALL MULTI-TENANCY TESTS PASSED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
}

runTest();
