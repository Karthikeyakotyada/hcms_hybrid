const mongoose = require('mongoose');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');
const ApplicationSettings = require('../models/ApplicationSettings');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');

// Helper to compute overall results for all teams dynamically across all rounds for a specific user
const calculateOverallResults = async (userId, search = '', department = '') => {
  let matchQuery = { user: userId };

  if (department) {
    matchQuery.department = { $regex: department, $options: 'i' };
  }

  if (search) {
    const trimmed = search.trim();
    const cleanNum = trimmed.replace(/^t[-_\s]*/i, '').replace(/^0+/, '');
    const isNumeric = /^\d+$/.test(cleanNum) && cleanNum.length > 0;

    if (isNumeric) {
      const teamExists = await Team.exists({ teamNumber: cleanNum, user: userId });
      if (teamExists) {
        matchQuery.teamNumber = cleanNum;
      } else {
        const matchingMembers = await Member.find({
          user: userId,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { registerNumber: { $regex: search, $options: 'i' } },
          ],
        }).select('teamId').lean();

        const teamIdsFromMembers = matchingMembers.map((m) => m.teamId);

        matchQuery.$or = [
          { teamNumber: cleanNum },
          { teamName: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { _id: { $in: teamIdsFromMembers } },
        ];
      }
    } else {
      const matchingMembers = await Member.find({
        user: userId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { registerNumber: { $regex: search, $options: 'i' } },
        ],
      }).select('teamId').lean();

      const teamIdsFromMembers = matchingMembers.map((m) => m.teamId);

      matchQuery.$or = [
        { teamNumber: { $regex: search, $options: 'i' } },
        { teamName: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { _id: { $in: teamIdsFromMembers } },
      ];
    }
  }

  // Parallelize lean queries for maximum performance scoped to this user
  const [teams, rounds, allScores, activeSession] = await Promise.all([
    Team.find(matchQuery).populate('members').lean(),
    Round.find({ user: userId, isActive: true }).sort({ order: 1 }).lean(),
    EvaluationScore.find({ user: userId }).lean(),
    AttendanceSession.findOne({ user: userId, isActive: true }).lean(),
  ]);

  // Load active session attendance for informational summary display
  const memberAttendanceMap = new Map();
  if (activeSession) {
    const activeAtt = await Attendance.find({ user: userId, sessionId: activeSession._id }).lean();
    activeAtt.forEach((a) => {
      memberAttendanceMap.set(a.memberId.toString(), a.status);
    });
  }

  // Create fast score lookup maps:
  const scoreMap = new Map();
  const indScoreMap = new Map();

  for (let i = 0; i < allScores.length; i++) {
    const s = allScores[i];
    const rIdStr = s.roundId.toString();
    const tIdStr = s.teamId.toString();
    const pairKey = `${rIdStr}_${tIdStr}`;
    scoreMap.set(pairKey, s);

    if (s.individualScores && Array.isArray(s.individualScores)) {
      for (let j = 0; j < s.individualScores.length; j++) {
        const item = s.individualScores[j];
        if (item.memberId && item.score !== null && item.score !== undefined) {
          indScoreMap.set(`${pairKey}_${item.memberId.toString()}`, item.score);
        }
      }
    }
  }

  const results = teams.map((team) => {
    let weightedTotalScore = 0;
    let rawTotalScore = 0;
    let evaluatedRoundsCount = 0;
    const roundScoresList = [];
    const teamIdStr = team._id.toString();

    // Informational attendance summary
    let presentMembers = 0;
    let absentMembers = 0;
    const totalMembers = team.members ? team.members.length : 0;
    (team.members || []).forEach((m) => {
      const st = memberAttendanceMap.get(m._id.toString());
      if (st === 'PRESENT') presentMembers++;
      else if (st === 'ABSENT') absentMembers++;
    });
    const notMarkedMembers = Math.max(0, totalMembers - presentMembers - absentMembers);

    let latestScoreUpdate = null;

    rounds.forEach((r) => {
      const rIdStr = r._id.toString();
      const scoreDoc = scoreMap.get(`${rIdStr}_${teamIdStr}`);
      const score = scoreDoc && scoreDoc.teamScore !== undefined && scoreDoc.teamScore !== null ? scoreDoc.teamScore : null;
      const updatedAt = scoreDoc ? scoreDoc.updatedAt || scoreDoc.createdAt : null;

      if (updatedAt) {
        if (!latestScoreUpdate || new Date(updatedAt) > new Date(latestScoreUpdate)) {
          latestScoreUpdate = updatedAt;
        }
      }

      if (score !== null) {
        evaluatedRoundsCount++;
        rawTotalScore += score;
        weightedTotalScore += score * (r.weight || 1);
      }

      roundScoresList.push({
        roundId: r._id,
        roundName: r.name,
        score,
        weight: r.weight,
        updatedAt,
      });
    });

    const isFullyEvaluated = rounds.length > 0 && evaluatedRoundsCount === rounds.length;
    const finalScore = evaluatedRoundsCount > 0 ? Number(weightedTotalScore.toFixed(2)) : null;

    const memberDetails = (team.members || []).map((m) => {
      let totalMemberScore = 0;
      let evaluatedRoundsForMember = 0;
      let memberLatestUpdate = null;
      const memberIdStr = m._id.toString();

      const memberRoundScores = rounds.map((r) => {
        const rIdStr = r._id.toString();
        const scoreDoc = scoreMap.get(`${rIdStr}_${teamIdStr}`);
        const indScore = indScoreMap.get(`${rIdStr}_${teamIdStr}_${memberIdStr}`) ?? null;
        const updatedAt = scoreDoc ? scoreDoc.updatedAt || scoreDoc.createdAt : null;

        if (indScore !== null) {
          totalMemberScore += indScore;
          evaluatedRoundsForMember++;
          if (updatedAt) {
            if (!memberLatestUpdate || new Date(updatedAt) > new Date(memberLatestUpdate)) {
              memberLatestUpdate = updatedAt;
            }
          }
        }
        return {
          roundId: r._id,
          roundName: r.name,
          score: indScore,
          updatedAt,
        };
      });

      const avgScore =
        evaluatedRoundsForMember > 0
          ? Number((totalMemberScore / evaluatedRoundsForMember).toFixed(2))
          : null;

      return {
        memberId: m._id,
        name: m.name,
        registerNumber: m.registerNumber,
        department: m.department,
        email: m.email || '',
        phone: m.phone || '',
        roundScores: memberRoundScores,
        avgScore: avgScore,
        evaluatedRoundsCount: evaluatedRoundsForMember,
        lastEvaluatedAt: memberLatestUpdate || latestScoreUpdate,
      };
    });

    return {
      _id: team._id,
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      department: team.department,
      roundScores: roundScoresList,
      rawTotalScore,
      weightedTotalScore: finalScore,
      finalScore,
      lastEvaluatedAt: latestScoreUpdate,
      members: memberDetails,
      attendanceSummary: {
        present: presentMembers,
        absent: absentMembers,
        notMarked: notMarkedMembers,
        total: totalMembers,
        display: totalMembers > 0 ? `${presentMembers}/${totalMembers}` : '-',
      },
      isFullyEvaluated,
      evaluatedRoundsCount,
      totalActiveRounds: rounds.length,
    };
  });

  // Sort descending by finalScore, then rawTotalScore
  results.sort((a, b) => {
    if (a.finalScore === null && b.finalScore === null) return 0;
    if (a.finalScore === null) return 1;
    if (b.finalScore === null) return -1;
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    return (b.rawTotalScore || 0) - (a.rawTotalScore || 0);
  });

  // Assign ranks
  for (let i = 0; i < results.length; i++) {
    if (results[i].finalScore === null) {
      results[i].rank = '-';
      continue;
    }
    if (
      i > 0 &&
      results[i - 1].finalScore !== null &&
      results[i].finalScore === results[i - 1].finalScore
    ) {
      results[i].rank = results[i - 1].rank;
    } else {
      results[i].rank = i + 1;
    }
  }

  return results;
};

// @desc    Get overall competition & individual results
// @route   GET /api/results
// @access  Private
const getResults = async (req, res) => {
  try {
    const userId = req.user._id;
    const search = req.query.search || '';
    const department = req.query.department || '';
    const results = await calculateOverallResults(userId, search, department);
    res.json(results);
  } catch (error) {
    console.error('Error computing results:', error);
    res.status(500).json({ message: 'Server error computing results', error: error.message });
  }
};

// @desc    Get winners / top rankings
// @route   GET /api/winners
// @access  Private
const getWinners = async (req, res) => {
  try {
    const userId = req.user._id;
    let settings = await ApplicationSettings.findOne({ user: userId }).lean();
    const topCount = settings ? settings.topTeamsCount : 3;

    const results = await calculateOverallResults(userId);
    const evaluatedTeams = results.filter((t) => t.finalScore !== null);
    const winners = evaluatedTeams.slice(0, topCount);

    res.json({
      topCount,
      winners,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching winners', error: error.message });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const [totalTeams, totalParticipants, activeRounds, settingsDoc, activeSession] = await Promise.all([
      Team.countDocuments({ user: userId }),
      Member.countDocuments({ user: userId }),
      Round.find({ user: userId, isActive: true }).select('_id').lean(),
      ApplicationSettings.findOne({ user: userId }).lean(),
      AttendanceSession.findOne({ user: userId, isActive: true }).lean(),
    ]);

    let settings = settingsDoc;
    if (!settings) {
      settings = await ApplicationSettings.create({
        user: userId,
        isLocked: false,
        enableIndividualScoring: true,
        topTeamsCount: 3,
      });
    }

    const activeRoundIds = activeRounds.map((r) => r._id);
    const activeRoundsCount = activeRoundIds.length;

    let completedEvaluations = 0;
    if (activeRoundsCount > 0 && totalTeams > 0) {
      const userObjectId = new mongoose.Types.ObjectId(userId.toString());
      const evaluatedCounts = await EvaluationScore.aggregate([
        {
          $match: {
            user: userObjectId,
            roundId: { $in: activeRoundIds },
            teamScore: { $ne: null, $exists: true },
          },
        },
        {
          $group: {
            _id: '$teamId',
            count: { $sum: 1 },
          },
        },
        {
          $match: {
            count: { $gte: activeRoundsCount },
          },
        },
      ]);
      completedEvaluations = evaluatedCounts.length;
    }

    const pendingEvaluations = Math.max(0, totalTeams - completedEvaluations);
    const progressPercentage =
      totalTeams > 0 ? Math.round((completedEvaluations / totalTeams) * 100) : 0;

    // Attendance stats for dashboard
    let attendanceStats = {
      presentCount: 0,
      absentCount: 0,
      notMarkedCount: totalParticipants,
      attendanceRate: 0,
      sessionName: activeSession ? activeSession.name : 'Event Check-in',
    };

    if (activeSession) {
      const activeAttendance = await Attendance.find({ user: userId, sessionId: activeSession._id }).lean();
      let pCount = 0;
      let aCount = 0;
      activeAttendance.forEach((a) => {
        if (a.status === 'PRESENT') pCount++;
        else if (a.status === 'ABSENT') aCount++;
      });
      const nmCount = Math.max(0, totalParticipants - pCount - aCount);
      const rate = totalParticipants > 0 ? Number(((pCount / totalParticipants) * 100).toFixed(1)) : 0;

      attendanceStats = {
        presentCount: pCount,
        absentCount: aCount,
        notMarkedCount: nmCount,
        attendanceRate: rate,
        sessionName: activeSession.name,
      };
    }

    res.json({
      totalTeams,
      totalParticipants,
      activeRoundsCount,
      isLocked: settings.isLocked,
      completedEvaluations,
      pendingEvaluations,
      progressPercentage,
      attendanceStats,
      recentActivities: [],
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching stats', error: error.message });
  }
};

module.exports = {
  calculateOverallResults,
  getResults,
  getWinners,
  getDashboardStats,
};
