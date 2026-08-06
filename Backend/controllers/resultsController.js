const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');
const ApplicationSettings = require('../models/ApplicationSettings');

// Helper to compute overall results for all teams dynamically across all rounds
const calculateOverallResults = async (search = '', department = '') => {
  let matchQuery = {};
  if (department) {
    matchQuery.department = { $regex: department, $options: 'i' };
  }
  if (search) {
    const trimmed = search.trim();
    const cleanNum = trimmed.replace(/^t[-_\s]*/i, '').replace(/^0+/, '');
    const isNumeric = /^\d+$/.test(cleanNum) && cleanNum.length > 0;

    if (isNumeric) {
      const teamExists = await Team.exists({ teamNumber: cleanNum });
      if (teamExists) {
        matchQuery.teamNumber = cleanNum;
      } else {
        const matchingMembers = await Member.find({
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { registerNumber: { $regex: search, $options: 'i' } },
          ],
        }).select('teamId');

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
        { _id: { $in: teamIdsFromMembers } },
      ];
    }
  }

  const teams = await Team.find(matchQuery).populate('members');
  const rounds = await Round.find({ isActive: true }).sort({ order: 1 });
  const allScores = await EvaluationScore.find();

  // Create score lookup map: key = `${roundId}_${teamId}`
  const scoreMap = new Map();
  allScores.forEach((s) => scoreMap.set(`${s.roundId.toString()}_${s.teamId.toString()}`, s));

  const results = teams.map((team) => {
    let weightedTotalScore = 0;
    let rawTotalScore = 0;
    let evaluatedRoundsCount = 0;
    const roundScoresList = [];

    rounds.forEach((r) => {
      const scoreDoc = scoreMap.get(`${r._id.toString()}_${team._id.toString()}`);
      const score = scoreDoc ? scoreDoc.teamScore : null;

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
      });
    });

    const isFullyEvaluated = rounds.length > 0 && evaluatedRoundsCount === rounds.length;
    const finalScore = evaluatedRoundsCount > 0 ? Number(weightedTotalScore.toFixed(2)) : null;

    const memberDetails = team.members.map((m) => {
      let totalMemberScore = 0;
      let evaluatedRoundsForMember = 0;

      const memberRoundScores = rounds.map((r) => {
        const scoreDoc = scoreMap.get(`${r._id.toString()}_${team._id.toString()}`);
        let indScore = null;
        if (scoreDoc && scoreDoc.individualScores) {
          const match = scoreDoc.individualScores.find(
            (item) => item.memberId.toString() === m._id.toString()
          );
          if (match && match.score !== null && match.score !== undefined) {
            indScore = match.score;
            totalMemberScore += indScore;
            evaluatedRoundsForMember++;
          }
        }
        return {
          roundId: r._id,
          roundName: r.name,
          score: indScore,
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
        email: m.email,
        phone: m.phone,
        roundScores: memberRoundScores,
        avgScore: avgScore,
        evaluatedRoundsCount: evaluatedRoundsForMember,
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
      members: memberDetails,
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
    const totalTeams = await Team.countDocuments();
    const totalParticipants = await Member.countDocuments();
    const activeRoundsCount = await Round.countDocuments({ isActive: true });

    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = await ApplicationSettings.create({
        isLocked: false,
        topTeamsCount: 3,
      });
    }

    const allResults = await calculateOverallResults();
    const completedEvaluations = allResults.filter((t) => t.isFullyEvaluated).length;
    const pendingEvaluations = totalTeams - completedEvaluations;

    const progressPercentage =
      totalTeams > 0 ? Math.round((completedEvaluations / totalTeams) * 100) : 0;

    res.json({
      totalTeams,
      totalParticipants,
      activeRoundsCount,
      isLocked: settings.isLocked,
      completedEvaluations,
      pendingEvaluations,
      progressPercentage,
      recentActivities: [],
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
