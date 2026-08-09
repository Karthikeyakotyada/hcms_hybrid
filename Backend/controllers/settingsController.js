const ApplicationSettings = require('../models/ApplicationSettings');
const EvaluationScore = require('../models/EvaluationScore');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get system settings for current user
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    let settings = await ApplicationSettings.findOne({ user: userId });
    if (!settings) {
      settings = await ApplicationSettings.create({
        user: userId,
        isLocked: false,
        enableIndividualScoring: true,
        topTeamsCount: 3,
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// @desc    Update system settings for current user
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { isLocked, enableIndividualScoring, topTeamsCount } = req.body;

    let settings = await ApplicationSettings.findOne({ user: userId });
    if (!settings) {
      settings = new ApplicationSettings({ user: userId });
    }

    if (typeof isLocked === 'boolean') {
      settings.isLocked = isLocked;
    }

    if (typeof enableIndividualScoring === 'boolean') {
      settings.enableIndividualScoring = enableIndividualScoring;
    }

    if (topTeamsCount && Number(topTeamsCount) >= 1 && Number(topTeamsCount) <= 10) {
      settings.topTeamsCount = Number(topTeamsCount);
    }

    await settings.save();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// @desc    Reset all evaluation data for current user (Double Authenticated)
// @route   POST /api/settings/reset
// @access  Private
const resetEvaluation = async (req, res) => {
  try {
    const userId = req.user._id;
    const { password, confirmationPhrase } = req.body;

    // Step 1: Verification Phrase Check
    if (!confirmationPhrase || confirmationPhrase.trim().toUpperCase() !== 'RESET') {
      return res.status(400).json({
        message: "Verification failed: You must type 'RESET' exactly to confirm this action.",
      });
    }

    // Step 2: Password Authentication Check
    if (!password) {
      return res.status(400).json({
        message: 'Security check: Account password is required to authorize evaluation reset.',
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User account not found' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Authentication failed: Incorrect password. Evaluation reset aborted for security.',
      });
    }

    // Erase only evaluation scores for this user's workspace
    const deleteResult = await EvaluationScore.deleteMany({ user: userId });

    let settings = await ApplicationSettings.findOne({ user: userId });
    if (!settings) {
      settings = new ApplicationSettings({ user: userId });
    }
    settings.isLocked = false;
    await settings.save();

    await logActivity(
      'SCORES_RESET',
      `User ${user.username} successfully reset evaluation scores (${deleteResult.deletedCount} scores deleted)`
    );

    res.json({
      message: `Security verified: All evaluation scores (${deleteResult.deletedCount}) in your workspace have been successfully reset.`,
      deletedCount: deleteResult.deletedCount,
      settings,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting evaluation', error: error.message });
  }
};

// Obsolete Activity Logs endpoint returning clean empty response
const getActivityLogs = async (req, res) => {
  res.json({
    logs: [],
    pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
  });
};

module.exports = {
  getSettings,
  updateSettings,
  resetEvaluation,
  getActivityLogs,
};
