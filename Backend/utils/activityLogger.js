const ActivityLog = require('../models/ActivityLog');

const logActivity = async (action, details, user = 'Organizer') => {
  try {
    await ActivityLog.create({
      action,
      details,
      user,
      timestamp: new Date(),
    });
  } catch (err) {
    console.error('Failed to record activity log:', err.message);
  }
};

module.exports = { logActivity };
