const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');

// @desc    Get evaluation scores for a team in a specific round
// @route   GET /api/evaluation/round/:roundId/team/:teamId
// @access  Private
const getScoresForRoundAndTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roundId, teamId } = req.params;

    const [team, round, scoreDoc] = await Promise.all([
      Team.findOne({ _id: teamId, user: userId }).populate('members').lean(),
      Round.findOne({ _id: roundId, user: userId }).lean(),
      EvaluationScore.findOne({ roundId, teamId, user: userId }).lean(),
    ]);

    if (!team) {
      return res.status(404).json({ message: 'Team not found in your workspace' });
    }

    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found in your workspace' });
    }

    res.json({
      team,
      round,
      competitionScore: scoreDoc ? scoreDoc.teamScore : null,
      comments: scoreDoc ? scoreDoc.comments : '',
      individualScores: scoreDoc ? scoreDoc.individualScores : [],
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluation scores', error: error.message });
  }
};

// @desc    Get all evaluation scores for a specific round (Batch fetch for instant UI loading)
// @route   GET /api/evaluation/round/:roundId/scores
// @access  Private
const getScoresForRound = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roundId } = req.params;
    const scores = await EvaluationScore.find({ roundId, user: userId }).lean();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching round scores', error: error.message });
  }
};

// @desc    Save team competition & member scores for a specific round
// @route   POST /api/evaluation/round/:roundId/team/:teamId
// @access  Private
const saveScoresForRoundAndTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roundId, teamId } = req.params;
    const { competitionScore, comments, individualScores } = req.body;

    const [team, round] = await Promise.all([
      Team.findOne({ _id: teamId, user: userId }).populate('members').lean(),
      Round.findOne({ _id: roundId, user: userId }).lean(),
    ]);

    if (!team) {
      return res.status(404).json({ message: 'Team not found in your workspace' });
    }

    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found in your workspace' });
    }

    if (round.isLocked) {
      return res.status(403).json({ message: `Round '${round.name}' is currently locked.` });
    }

    // Validate Team Score (1 - 50)
    const numCompScore = Number(competitionScore);
    if (isNaN(numCompScore) || numCompScore < 1 || numCompScore > 50) {
      return res.status(400).json({
        message: 'Team Competition Score must be a valid number between 1 and 50',
      });
    }

    // Format and Validate Individual Member Scores (1 - 100)
    const formattedIndScores = [];
    if (individualScores && Array.isArray(individualScores)) {
      for (const item of individualScores) {
        if (item.memberId && item.score !== undefined && item.score !== null && item.score !== '') {
          const scoreVal = Number(item.score);
          if (isNaN(scoreVal) || scoreVal < 1 || scoreVal > 100) {
            return res.status(400).json({
              message: 'Individual member scores must be between 1 and 100',
            });
          }
          formattedIndScores.push({
            memberId: item.memberId,
            score: scoreVal,
          });
        }
      }
    }

    // Save or Update single EvaluationScore document scoped to user
    const savedDoc = await EvaluationScore.findOneAndUpdate(
      { roundId, teamId, user: userId },
      {
        user: userId,
        roundId,
        teamId,
        teamScore: numCompScore,
        comments: comments ? comments.trim() : '',
        individualScores: formattedIndScores,
        updatedBy: req.user ? req.user.username : 'Organizer',
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();

    res.json({
      message: `Evaluation saved successfully for ${round.name}`,
      scoreDoc: savedDoc,
    });
  } catch (error) {
    console.error('Error saving round score:', error);
    res.status(500).json({ message: 'Error saving round evaluation', error: error.message });
  }
};

// @desc    Get all evaluation scores across all rounds (Fast multi-round evaluation & average computing)
// @route   GET /api/evaluation/all-scores
// @access  Private
const getAllEvaluationScores = async (req, res) => {
  try {
    const userId = req.user._id;
    const scores = await EvaluationScore.find({ user: userId }).lean();
    res.json(scores);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching all evaluation scores', error: error.message });
  }
};

module.exports = {
  getScoresForRoundAndTeam,
  getScoresForRound,
  getAllEvaluationScores,
  saveScoresForRoundAndTeam,
};
