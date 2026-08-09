const ApplicationSettings = require('../models/ApplicationSettings');

const getSettings = async (userId) => {
  if (!userId) {
    let settings = await ApplicationSettings.findOne();
    return settings;
  }
  let settings = await ApplicationSettings.findOne({ user: userId });
  if (!settings) {
    settings = await ApplicationSettings.create({
      user: userId,
      isLocked: false,
      enableIndividualScoring: true,
      topTeamsCount: 3,
    });
  }
  return settings;
};

const checkEvaluationLock = async (req, res, next) => {
  try {
    const userId = req.user ? req.user._id : null;
    const settings = await getSettings(userId);
    if (settings && settings.isLocked) {
      return res.status(403).json({
        message: 'Evaluation system is currently LOCKED for your workspace.',
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
