const ApplicationSettings = require('../models/ApplicationSettings');

const getSettings = async () => {
  let settings = await ApplicationSettings.findOne();
  if (!settings) {
    settings = await ApplicationSettings.create({
      currentRound: 'Round 1',
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
        message: 'Evaluation is currently LOCKED. Edits are disabled everywhere.',
      });
    }
    req.settings = settings;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking lock status', error: error.message });
  }
};

const checkRound1Access = async (req, res, next) => {
  try {
    const settings = req.settings || (await getSettings());
    if (settings.isLocked) {
      return res.status(403).json({ message: 'Evaluation is locked.' });
    }
    if (settings.currentRound === 'Round 2' || settings.currentRound === 'Completed') {
      return res.status(403).json({
        message: 'Round 1 is read-only because the event has progressed beyond Round 1.',
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking round access', error: error.message });
  }
};

const checkRound2Access = async (req, res, next) => {
  try {
    const settings = req.settings || (await getSettings());
    if (settings.isLocked) {
      return res.status(403).json({ message: 'Evaluation is locked.' });
    }
    if (settings.currentRound === 'Round 1') {
      return res.status(403).json({
        message: 'Round 2 is locked until Round 1 is completed and current round is set to Round 2 in settings.',
      });
    }
    if (settings.currentRound === 'Completed') {
      return res.status(403).json({
        message: 'Round 2 is read-only because evaluation is marked as Completed.',
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error checking round access', error: error.message });
  }
};

module.exports = {
  checkEvaluationLock,
  checkRound1Access,
  checkRound2Access,
  getSettings,
};
