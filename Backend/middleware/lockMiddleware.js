const ApplicationSettings = require('../models/ApplicationSettings');

const getSettings = async () => {
  let settings = await ApplicationSettings.findOne();
  if (!settings) {
    settings = await ApplicationSettings.create({
      isLocked: false,
      topTeamsCount: 3,
    });
  }
  return settings;
};

const checkEvaluationLock = async (req, res, next) => {
  try {
    const settings = await getSettings();
    if (settings.isLocked) {
      return res.status(403).json({
        message: 'Evaluation system is currently LOCKED.',
      });
    }
    req.settings = settings;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking lock status', error: error.message });
  }
};

module.exports = {
  checkEvaluationLock,
  getSettings,
};
