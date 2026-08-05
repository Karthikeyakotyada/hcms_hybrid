const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');

// @desc    Get evaluation scores for a team in a specific round
// @route   GET /api/evaluation/round/:roundId/team/:teamId
// @access  Private
const getScoresForRoundAndTeam = async (req, res) => {
  try {
    const { roundId, teamId } = req.params;

    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found' });
    }

    const scoreDoc = await EvaluationScore.findOne({ roundId, teamId });

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

// @desc    Save team competition & member scores for a specific round
// @route   POST /api/evaluation/round/:roundId/team/:teamId
// @access  Private
const saveScoresForRoundAndTeam = async (req, res) => {
  try {
    const { roundId, teamId } = req.params;
    const { competitionScore, comments, individualScores } = req.body;

    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const round = await Round.findById(roundId);
    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found' });
    }

    if (round.isLocked) {
      return res.status(403).json({ message: `Round '${round.name}' is currently locked.` });
    }

    // Validate Team Score (1 - 10)
    const numCompScore = Number(competitionScore);
    if (isNaN(numCompScore) || numCompScore < 1 || numCompScore > 10) {
      return res.status(400).json({
        message: 'Team Competition Score must be a valid number between 1 and 10',
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

    // Save or Update single EvaluationScore document
    await EvaluationScore.findOneAndUpdate(
      { roundId, teamId },
      {
        teamScore: numCompScore,
        comments: comments ? comments.trim() : '',
        individualScores: formattedIndScores,
        updatedBy: req.user ? req.user.username : 'Organizer',
      },
      { upsert: true, new: true }
    );

    res.json({ message: `Evaluation saved successfully for ${round.name}` });
  } catch (error) {
    console.error('Error saving round score:', error);
    res.status(500).json({ message: 'Error saving round evaluation', error: error.message });
  }
};

module.exports = {
  getScoresForRoundAndTeam,
  saveScoresForRoundAndTeam,
};
