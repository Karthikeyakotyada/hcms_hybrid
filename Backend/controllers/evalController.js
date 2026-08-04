const Team = require('../models/Team');
const Member = require('../models/Member');
const Round1IndividualScore = require('../models/Round1IndividualScore');
const Round2IndividualScore = require('../models/Round2IndividualScore');
const Round1CompetitionScore = require('../models/Round1CompetitionScore');
const Round2CompetitionScore = require('../models/Round2CompetitionScore');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get Round 1 scores for a team
// @route   GET /api/evaluation/round1/:teamId
// @access  Private
const getRound1Scores = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const competitionScoreDoc = await Round1CompetitionScore.findOne({ teamId });
    const individualScoresDocs = await Round1IndividualScore.find({ teamId });

    res.json({
      team,
      competitionScore: competitionScoreDoc ? competitionScoreDoc.score : null,
      comments: competitionScoreDoc ? competitionScoreDoc.comments : '',
      individualScores: individualScoresDocs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Round 1 scores', error: error.message });
  }
};

// @desc    Save Round 1 scores (competition score 1-10 + member scores)
// @route   POST /api/evaluation/round1/:teamId
// @access  Private
const saveRound1Scores = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { competitionScore, comments, individualScores } = req.body;

    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Validate Competition Score (1-10)
    const numCompScore = Number(competitionScore);
    if (isNaN(numCompScore) || numCompScore < 1 || numCompScore > 10) {
      return res.status(400).json({
        message: 'Competition Score must be a valid number between 1 and 10',
      });
    }

    // Save or Update Round 1 Competition Score
    await Round1CompetitionScore.findOneAndUpdate(
      { teamId },
      {
        score: numCompScore,
        comments: comments ? comments.trim() : '',
        updatedBy: req.user ? req.user.username : 'Organizer',
      },
      { upsert: true, new: true }
    );

    // Save Individual Scores if provided
    if (individualScores && Array.isArray(individualScores)) {
      for (const item of individualScores) {
        if (item.memberId && item.score !== undefined && item.score !== null) {
          const scoreVal = Number(item.score);
          if (!isNaN(scoreVal) && scoreVal >= 0) {
            await Round1IndividualScore.findOneAndUpdate(
              { teamId, memberId: item.memberId },
              {
                score: scoreVal,
                updatedBy: req.user ? req.user.username : 'Organizer',
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    }

    await logActivity(
      'ROUND1_SCORE_SAVED',
      `Saved Round 1 score (${numCompScore}/10) for Team '${team.teamNumber}'`
    );

    res.json({ message: 'Round 1 evaluation saved successfully' });
  } catch (error) {
    console.error('Error saving Round 1 score:', error);
    res.status(500).json({ message: 'Error saving Round 1 score', error: error.message });
  }
};

// @desc    Get Round 2 scores for a team
// @route   GET /api/evaluation/round2/:teamId
// @access  Private
const getRound2Scores = async (req, res) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const competitionScoreDoc = await Round2CompetitionScore.findOne({ teamId });
    const individualScoresDocs = await Round2IndividualScore.find({ teamId });

    res.json({
      team,
      competitionScore: competitionScoreDoc ? competitionScoreDoc.score : null,
      comments: competitionScoreDoc ? competitionScoreDoc.comments : '',
      individualScores: individualScoresDocs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching Round 2 scores', error: error.message });
  }
};

// @desc    Save Round 2 scores (competition score 1-10 + member scores)
// @route   POST /api/evaluation/round2/:teamId
// @access  Private
const saveRound2Scores = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { competitionScore, comments, individualScores } = req.body;

    const team = await Team.findById(teamId).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Validate Competition Score (1-10)
    const numCompScore = Number(competitionScore);
    if (isNaN(numCompScore) || numCompScore < 1 || numCompScore > 10) {
      return res.status(400).json({
        message: 'Competition Score must be a valid number between 1 and 10',
      });
    }

    // Save or Update Round 2 Competition Score
    await Round2CompetitionScore.findOneAndUpdate(
      { teamId },
      {
        score: numCompScore,
        comments: comments ? comments.trim() : '',
        updatedBy: req.user ? req.user.username : 'Organizer',
      },
      { upsert: true, new: true }
    );

    // Save Individual Scores if provided
    if (individualScores && Array.isArray(individualScores)) {
      for (const item of individualScores) {
        if (item.memberId && item.score !== undefined && item.score !== null) {
          const scoreVal = Number(item.score);
          if (!isNaN(scoreVal) && scoreVal >= 0) {
            await Round2IndividualScore.findOneAndUpdate(
              { teamId, memberId: item.memberId },
              {
                score: scoreVal,
                updatedBy: req.user ? req.user.username : 'Organizer',
              },
              { upsert: true, new: true }
            );
          }
        }
      }
    }

    await logActivity(
      'ROUND2_SCORE_SAVED',
      `Saved Round 2 score (${numCompScore}/10) for Team '${team.teamNumber}'`
    );

    res.json({ message: 'Round 2 evaluation saved successfully' });
  } catch (error) {
    console.error('Error saving Round 2 score:', error);
    res.status(500).json({ message: 'Error saving Round 2 score', error: error.message });
  }
};

module.exports = {
  getRound1Scores,
  saveRound1Scores,
  getRound2Scores,
  saveRound2Scores,
};
