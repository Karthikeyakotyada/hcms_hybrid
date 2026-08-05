const ApplicationSettings = require('../models/ApplicationSettings');
const EvaluationScore = require('../models/EvaluationScore');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private
const getSettings = async (req, res) => {
  try {
    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = await ApplicationSettings.create({
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
    const { isLocked, topTeamsCount } = req.body;

    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = new ApplicationSettings();
    }

    if (typeof isLocked === 'boolean') {
      settings.isLocked = isLocked;
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

// @desc    Reset all evaluation data
// @route   POST /api/settings/reset
// @access  Private
const resetEvaluation = async (req, res) => {
  try {
    await EvaluationScore.deleteMany({});

    let settings = await ApplicationSettings.findOne();
    if (!settings) {
      settings = new ApplicationSettings();
    }
    settings.isLocked = false;
    await settings.save();

    res.json({ message: 'All evaluation scores have been successfully reset', settings });
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
