const Team = require('../models/Team');
const Member = require('../models/Member');
const Round1CompetitionScore = require('../models/Round1CompetitionScore');
const Round2CompetitionScore = require('../models/Round2CompetitionScore');
const Round1IndividualScore = require('../models/Round1IndividualScore');
const Round2IndividualScore = require('../models/Round2IndividualScore');
const ApplicationSettings = require('../models/ApplicationSettings');
const ActivityLog = require('../models/ActivityLog');

// Helper to compute overall results for all teams
const calculateOverallResults = async (search = '', department = '') => {
  let matchQuery = {};
  if (department) {
    matchQuery.department = { $regex: department, $options: 'i' };
  }
  if (search) {
    const matchingMembers = await Member.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
      ],
    }).select('teamId');

    const teamIdsFromMembers = matchingMembers.map((m) => m.teamId);

    matchQuery.$or = [
      { teamNumber: { $regex: search, $options: 'i' } },
      { teamName: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { guideName: { $regex: search, $options: 'i' } },
      { _id: { $in: teamIdsFromMembers } },
    ];
  }

  const teams = await Team.find(matchQuery).populate('members');
  const r1Scores = await Round1CompetitionScore.find();
  const r2Scores = await Round2CompetitionScore.find();
  const r1IndScores = await Round1IndividualScore.find();
  const r2IndScores = await Round2IndividualScore.find();

  // Create lookups
  const r1Map = new Map();
  r1Scores.forEach((s) => r1Map.set(s.teamId.toString(), s.score));

  const r2Map = new Map();
  r2Scores.forEach((s) => r2Map.set(s.teamId.toString(), s.score));

  const r1IndMap = new Map();
  r1IndScores.forEach((s) => r1IndMap.set(`${s.teamId.toString()}_${s.memberId.toString()}`, s.score));

  const r2IndMap = new Map();
  r2IndScores.forEach((s) => r2IndMap.set(`${s.teamId.toString()}_${s.memberId.toString()}`, s.score));

  const results = teams.map((team) => {
    const r1Score = r1Map.get(team._id.toString()) ?? null;
    const r2Score = r2Map.get(team._id.toString()) ?? null;

    let finalScore = null;
    if (r1Score !== null && r2Score !== null) {
      finalScore = r1Score * r2Score;
    } else if (r1Score !== null) {
      // Partial calculation if only R1 completed
      finalScore = r1Score;
    }

    const memberDetails = team.members.map((m) => ({
      memberId: m._id,
      name: m.name,
      registerNumber: m.registerNumber,
      department: m.department,
      email: m.email,
      phone: m.phone,
      r1Score: r1IndMap.get(`${team._id.toString()}_${m._id.toString()}`) ?? null,
      r2Score: r2IndMap.get(`${team._id.toString()}_${m._id.toString()}`) ?? null,
    }));

    return {
      _id: team._id,
      teamNumber: team.teamNumber,
      teamName: team.teamName,
      department: team.department,
      guideName: team.guideName,
      r1Score,
      r2Score,
      finalScore,
      members: memberDetails,
      isFullyEvaluated: r1Score !== null && r2Score !== null,
      isR1Evaluated: r1Score !== null,
      isR2Evaluated: r2Score !== null,
    };
  });

  // Sort descending by finalScore, then r2Score, then r1Score, then teamNumber
  results.sort((a, b) => {
    if (a.finalScore === null && b.finalScore === null) return 0;
    if (a.finalScore === null) return 1;
    if (b.finalScore === null) return -1;
    if (b.finalScore !== a.finalScore) return b.finalScore - a.finalScore;
    if ((b.r2Score || 0) !== (a.r2Score || 0)) return (b.r2Score || 0) - (a.r2Score || 0);
    return (b.r1Score || 0) - (a.r1Score || 0);
  });

  // Assign ranks handling ties
  let currentRank = 1;
  for (let i = 0; i < results.length; i++) {
    if (results[i].finalScore === null) {
      results[i].rank = '-';
      continue;
    }
    if (
      i > 0 &&
      results[i - 1].finalScore !== null &&
      results[i].finalScore === results[i - 1].finalScore &&
      results[i].r2Score === results[i - 1].r2Score &&
      results[i].r1Score === results[i - 1].r1Score
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
    const search = req.query.search || '';
    const department = req.query.department || '';
    const results = await calculateOverallResults(search, department);
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
    let settings = await ApplicationSettings.findOne();
    const topCount = settings ? settings.topTeamsCount : 3;

    const results = await calculateOverallResults();
    // Filter only teams that have a final score (or at least Round 1 score if in Round 1)
    const evaluatedTeams = results.filter((t) => t.finalScore !== null);
    const winners = evaluatedTeams.slice(0, topCount);

    res.json({
      topCount,
      currentRound: settings ? settings.currentRound : 'Round 1',
      winners,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching winners', error: error.message });
  }
};

// @desc    Get dashboard statistics & recent activity
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const totalTeams = await Team.countDocuments();
    const totalParticipants = await Member.countDocuments();

    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = await ApplicationSettings.create({
        currentRound: 'Round 1',
        isLocked: false,
        topTeamsCount: 3,
      });
    }

    const currentRound = settings.currentRound;

    // Completed evaluations count depends on active round
    const r1CompCount = await Round1CompetitionScore.countDocuments();
    const r2CompCount = await Round2CompetitionScore.countDocuments();

    let completedEvaluations = 0;
    let pendingEvaluations = 0;

    if (currentRound === 'Round 1') {
      completedEvaluations = r1CompCount;
      pendingEvaluations = totalTeams - r1CompCount;
    } else if (currentRound === 'Round 2') {
      completedEvaluations = r2CompCount;
      pendingEvaluations = totalTeams - r2CompCount;
    } else {
      // Completed
      const bothDoneCount = await calculateOverallResults();
      completedEvaluations = bothDoneCount.filter((t) => t.isFullyEvaluated).length;
      pendingEvaluations = totalTeams - completedEvaluations;
    }

    if (pendingEvaluations < 0) pendingEvaluations = 0;

    const progressPercentage =
      totalTeams > 0 ? Math.round((completedEvaluations / totalTeams) * 100) : 0;

    const recentActivities = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10);

    res.json({
      totalTeams,
      totalParticipants,
      currentRound,
      isLocked: settings.isLocked,
      completedEvaluations,
      pendingEvaluations,
      progressPercentage,
      recentActivities,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Server error fetching stats', error: error.message });
  }
};

module.exports = {
  getResults,
  getWinners,
  getDashboardStats,
};
