const ApplicationSettings = require('../models/ApplicationSettings');
const Round1CompetitionScore = require('../models/Round1CompetitionScore');
const Round2CompetitionScore = require('../models/Round2CompetitionScore');
const Round1IndividualScore = require('../models/Round1IndividualScore');
const Round2IndividualScore = require('../models/Round2IndividualScore');
const ActivityLog = require('../models/ActivityLog');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = await ApplicationSettings.create({
        currentRound: 'Round 1',
        isLocked: false,
        topTeamsCount: 3,
      });
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res) => {
  try {
    const { currentRound, isLocked, topTeamsCount } = req.body;

    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = new ApplicationSettings();
    }

    if (currentRound && ['Round 1', 'Round 2', 'Completed'].includes(currentRound)) {
      if (settings.currentRound !== currentRound) {
        await logActivity(
          'ROUND_CHANGED',
          `Evaluation active round changed from '${settings.currentRound}' to '${currentRound}'`
        );
        settings.currentRound = currentRound;
      }
    }

    if (typeof isLocked === 'boolean') {
      if (settings.isLocked !== isLocked) {
        await logActivity(
          isLocked ? 'EVALUATION_LOCKED' : 'EVALUATION_UNLOCKED',
          `Evaluation system ${isLocked ? 'LOCKED' : 'UNLOCKED'} by admin`
        );
        settings.isLocked = isLocked;
      }
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

// @desc    Reset all evaluation data (Danger Zone)
// @route   POST /api/settings/reset
// @access  Private
const resetEvaluation = async (req, res) => {
  try {
    // Delete all score records
    await Round1CompetitionScore.deleteMany({});
    await Round2CompetitionScore.deleteMany({});
    await Round1IndividualScore.deleteMany({});
    await Round2IndividualScore.deleteMany({});

    // Reset settings
    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = new ApplicationSettings();
    }
    settings.currentRound = 'Round 1';
    settings.isLocked = false;
    await settings.save();

    await logActivity('DANGER_RESET', 'DANGER ZONE: All evaluation scores were reset to zero');

    res.json({ message: 'All evaluation scores have been successfully reset', settings });
  } catch (error) {
    res.status(500).json({ message: 'Error resetting evaluation', error: error.message });
  }
};

// @desc    Get activity logs
// @route   GET /api/activity-logs
// @access  Private
const getActivityLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const total = await ActivityLog.countDocuments();
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity logs', error: error.message });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  resetEvaluation,
  getActivityLogs,
};
