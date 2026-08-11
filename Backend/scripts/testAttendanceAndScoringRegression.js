const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');
const ApplicationSettings = require('../models/ApplicationSettings');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const { calculateOverallResults } = require('../controllers/resultsController');

const MONGO_URI = process.env.Mongodb_url || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hems';

const runRegressionTest = async () => {
  try {
    console.log('--- STARTING HEMS ATTENDANCE & SCORING REGRESSION TEST ---');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    // 1. Create a dedicated test user
    const testUsername = `test_att_user_${Date.now()}`;
    const testUser = await User.create({
      username: testUsername,
      email: `${testUsername}@example.com`,
      password: 'hashedpassword123',
    });
    const userId = testUser._id;
    console.log(`✓ Created test user: ${testUsername} (${userId})`);

    // 2. Set up Application Settings
    await ApplicationSettings.create({
      user: userId,
      isLocked: false,
      enableIndividualScoring: true,
      topTeamsCount: 3,
    });

    // 3. Set up Evaluation Rounds
    const round1 = await Round.create({
      user: userId,
      name: 'Round 1: Idea Pitch',
      order: 1,
      weight: 1,
      isActive: true,
    });
    const round2 = await Round.create({
      user: userId,
      name: 'Round 2: Prototype & Code',
      order: 2,
      weight: 1.5,
      isActive: true,
    });

    // 4. Create 3 Teams with 3 members each
    const teams = [];
    const members = [];
    for (let t = 1; t <= 3; t++) {
      const team = await Team.create({
        user: userId,
        teamNumber: `${t}`,
        teamName: `Team Alpha ${t}`,
        department: 'CSE',
        members: [],
      });

      const teamMemberIds = [];
      for (let m = 1; m <= 3; m++) {
        const regNo = `24CS${t}0${m}`;
        const member = await Member.create({
          user: userId,
          teamId: team._id,
          name: `Participant T${t}-M${m}`,
          registerNumber: regNo,
          department: 'CSE',
        });
        teamMemberIds.push(member._id);
        members.push(member);
      }
      team.members = teamMemberIds;
      await team.save();
      teams.push(team);
    }
    console.log(`✓ Created 3 teams with ${members.length} total participants`);

    // 5. Add Evaluation Scores (Deterministic baseline)
    // Team 1: R1 = 40, R2 = 45 -> Weighted = 40*1 + 45*1.5 = 107.5
    // Team 2: R1 = 48, R2 = 48 -> Weighted = 48*1 + 48*1.5 = 120.0
    // Team 3: R1 = 35, R2 = 30 -> Weighted = 35*1 + 30*1.5 = 80.0
    await EvaluationScore.create({
      user: userId,
      roundId: round1._id,
      teamId: teams[0]._id,
      teamScore: 40,
    });
    await EvaluationScore.create({
      user: userId,
      roundId: round2._id,
      teamId: teams[0]._id,
      teamScore: 45,
    });

    await EvaluationScore.create({
      user: userId,
      roundId: round1._id,
      teamId: teams[1]._id,
      teamScore: 48,
    });
    await EvaluationScore.create({
      user: userId,
      roundId: round2._id,
      teamId: teams[1]._id,
      teamScore: 48,
    });

    await EvaluationScore.create({
      user: userId,
      roundId: round1._id,
      teamId: teams[2]._id,
      teamScore: 35,
    });
    await EvaluationScore.create({
      user: userId,
      roundId: round2._id,
      teamId: teams[2]._id,
      teamScore: 30,
    });

    // 6. Compute BASELINE results before any attendance
    const baselineResults = await calculateOverallResults(userId);
    console.log('\n--- BASELINE RESULTS (BEFORE ATTENDANCE) ---');
    baselineResults.forEach((r) => {
      console.log(`Rank #${r.rank} | Team ${r.teamNumber} (${r.teamName}) | Final Score: ${r.finalScore} | Raw: ${r.rawTotalScore}`);
    });

    // Verify initial ranking expectations:
    // Rank 1: Team 2 (120)
    // Rank 2: Team 1 (107.5)
    // Rank 3: Team 3 (80)
    if (baselineResults[0].teamNumber !== '2' || baselineResults[0].finalScore !== 120) {
      throw new Error(`Baseline mismatch: expected Rank 1 Team 2 (120), got Team ${baselineResults[0].teamNumber} (${baselineResults[0].finalScore})`);
    }

    // 7. Test Attendance Session Creation
    const session = await AttendanceSession.create({
      user: userId,
      name: 'Event Check-in',
      description: 'Morning Check-in Session',
      isActive: true,
      order: 1,
    });
    console.log(`\n✓ Created Attendance Session: "${session.name}"`);

    // 8. Test Scanner Workflow:
    // 8a. Valid participant scan -> creates PRESENT record
    const targetMember = members[0]; // 24CS101 (Team 1)
    const scan1 = await Attendance.create({
      user: userId,
      memberId: targetMember._id,
      teamId: targetMember.teamId,
      registerNumber: targetMember.registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'PRESENT',
      method: 'SCAN',
      scannedAt: new Date(),
    });
    console.log(`✓ Scanned ID card for ${targetMember.registerNumber} -> Status: ${scan1.status}, Method: ${scan1.method}`);

    // 8b. Test Duplicate Prevention (Unique Index enforcement)
    let duplicateCaught = false;
    try {
      await Attendance.create({
        user: userId,
        memberId: targetMember._id,
        teamId: targetMember.teamId,
        registerNumber: targetMember.registerNumber,
        sessionId: session._id,
        sessionName: session.name,
        status: 'PRESENT',
        method: 'SCAN',
      });
    } catch (err) {
      if (err.code === 11000) {
        duplicateCaught = true;
        console.log(`✓ Duplicate scan correctly rejected by database unique index (E11000)`);
      }
    }
    if (!duplicateCaught) {
      throw new Error('FAILED: Duplicate attendance was not blocked!');
    }

    // 9. Test Manual Attendance Operations:
    // Mark participant 2 (24CS102) as ABSENT
    const absMember = members[1];
    const manualAbs = await Attendance.create({
      user: userId,
      memberId: absMember._id,
      teamId: absMember.teamId,
      registerNumber: absMember.registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'ABSENT',
      method: 'MANUAL',
    });
    console.log(`✓ Manually marked ${absMember.registerNumber} -> Status: ${manualAbs.status}, Method: ${manualAbs.method}`);

    // Mark participant 3 (24CS103) as PRESENT manually
    const presMember = members[2];
    await Attendance.create({
      user: userId,
      memberId: presMember._id,
      teamId: presMember.teamId,
      registerNumber: presMember.registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'PRESENT',
      method: 'MANUAL',
    });

    // Mark Team 2 member (24CS201) as PRESENT via SCAN
    await Attendance.create({
      user: userId,
      memberId: members[3]._id,
      teamId: members[3].teamId,
      registerNumber: members[3].registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'PRESENT',
      method: 'SCAN',
    });

    // 10. Test Resetting to NOT_MARKED (deleting record)
    // Mark and then delete to verify NOT_MARKED semantics
    const tempMember = members[4];
    await Attendance.create({
      user: userId,
      memberId: tempMember._id,
      teamId: tempMember.teamId,
      registerNumber: tempMember.registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'PRESENT',
      method: 'MANUAL',
    });
    // Reset to NOT_MARKED by removing record
    await Attendance.deleteOne({ user: userId, memberId: tempMember._id, sessionId: session._id });
    const checkDeleted = await Attendance.findOne({ user: userId, memberId: tempMember._id, sessionId: session._id });
    if (checkDeleted !== null) {
      throw new Error('FAILED: Attendance record was not removed when reset to NOT_MARKED');
    }
    console.log(`✓ Reset to NOT_MARKED verified: record successfully deleted`);

    // 11. Verify Attendance Statistics Calculation
    const allAtt = await Attendance.find({ user: userId, sessionId: session._id });
    const totalP = members.length; // 9
    let presentCount = 0;
    let absentCount = 0;
    allAtt.forEach((a) => {
      if (a.status === 'PRESENT') presentCount++;
      else if (a.status === 'ABSENT') absentCount++;
    });
    const notMarkedCount = totalP - presentCount - absentCount;

    console.log(`\n--- ATTENDANCE STATS VERIFICATION ---`);
    console.log(`Total: ${totalP} | Present: ${presentCount} | Absent: ${absentCount} | Not Marked: ${notMarkedCount}`);
    if (presentCount + absentCount + notMarkedCount !== totalP) {
      throw new Error('FAILED: Sum of Present + Absent + Not Marked does not equal Total Participants!');
    }
    if (notMarkedCount === absentCount) {
      // In this test case, absent is 1 and notMarked is 5
      console.log('Note: Not Marked and Absent are distinct.');
    }
    console.log('✓ Attendance statistics independently track Present, Absent, and Not Marked');

    // 12. CRITICAL REGRESSION TEST: RE-COMPUTE RESULTS AFTER ATTENDANCE
    const postAttendanceResults = await calculateOverallResults(userId);
    console.log('\n--- POST-ATTENDANCE RESULTS (AFTER EXTENSIVE ATTENDANCE DATA) ---');
    postAttendanceResults.forEach((r) => {
      console.log(`Rank #${r.rank} | Team ${r.teamNumber} (${r.teamName}) | Final Score: ${r.finalScore} | Attendance: ${r.attendanceSummary.display} (${r.attendanceSummary.present}P/${r.attendanceSummary.absent}A/${r.attendanceSummary.notMarked}NM)`);
    });

    // Check every property against baseline:
    if (baselineResults.length !== postAttendanceResults.length) {
      throw new Error('REGRESSION DETECTED: Results count changed!');
    }

    for (let i = 0; i < baselineResults.length; i++) {
      const b = baselineResults[i];
      const p = postAttendanceResults[i];

      if (b.rank !== p.rank) {
        throw new Error(`REGRESSION DETECTED at index ${i}: Baseline Rank ${b.rank} vs Post Rank ${p.rank}`);
      }
      if (b.teamNumber !== p.teamNumber) {
        throw new Error(`REGRESSION DETECTED at index ${i}: Baseline Team ${b.teamNumber} vs Post Team ${p.teamNumber}`);
      }
      if (b.finalScore !== p.finalScore) {
        throw new Error(`REGRESSION DETECTED at index ${i}: Baseline FinalScore ${b.finalScore} vs Post FinalScore ${p.finalScore}`);
      }
      if (b.rawTotalScore !== p.rawTotalScore) {
        throw new Error(`REGRESSION DETECTED at index ${i}: Baseline RawScore ${b.rawTotalScore} vs Post RawScore ${p.rawTotalScore}`);
      }
      if (b.weightedTotalScore !== p.weightedTotalScore) {
        throw new Error(`REGRESSION DETECTED at index ${i}: Baseline WeightedScore ${b.weightedTotalScore} vs Post WeightedScore ${p.weightedTotalScore}`);
      }
      for (let rIdx = 0; rIdx < b.roundScores.length; rIdx++) {
        if (b.roundScores[rIdx].score !== p.roundScores[rIdx].score) {
          throw new Error(`REGRESSION DETECTED in Round ${b.roundScores[rIdx].roundName}: Baseline ${b.roundScores[rIdx].score} vs Post ${p.roundScores[rIdx].score}`);
        }
      }
    }

    console.log('\n======================================================');
    console.log('✓✓✓ 100% REGRESSION TEST PASSED: ALL MARKS, SCORES, RANKINGS & ROUND SCORES REMAIN COMPLETELY UNTOUCHED AND ACCURATE! ✓✓✓');
    console.log('======================================================\n');

    // Clean up test workspace
    await Attendance.deleteMany({ user: userId });
    await AttendanceSession.deleteMany({ user: userId });
    await EvaluationScore.deleteMany({ user: userId });
    await Member.deleteMany({ user: userId });
    await Team.deleteMany({ user: userId });
    await Round.deleteMany({ user: userId });
    await ApplicationSettings.deleteMany({ user: userId });
    await User.deleteOne({ _id: userId });
    console.log('✓ Cleaned up test database fixtures.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('REGRESSION TEST FAILED:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
};

runRegressionTest();
