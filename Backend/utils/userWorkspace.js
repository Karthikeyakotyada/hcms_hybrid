const ApplicationSettings = require('../models/ApplicationSettings');
const AttendanceSession = require('../models/AttendanceSession');

/**
 * Initializes a clean workspace for a newly registered user.
 * @param {string|mongoose.Types.ObjectId} userId - The user ID to initialize data for
 */
const initializeUserWorkspace = async (userId) => {
  try {
    // Initialize Application Settings for this user if not present
    let settings = await ApplicationSettings.findOne({ user: userId });
    if (!settings) {
      settings = await ApplicationSettings.create({
        user: userId,
        isLocked: false,
        enableIndividualScoring: true,
        topTeamsCount: 3,
      });
    }

    // Initialize default Attendance Session if not present
    let session = await AttendanceSession.findOne({ user: userId });
    if (!session) {
      session = await AttendanceSession.create({
        user: userId,
        name: 'Event Check-in',
        description: 'Main event check-in and registration scan',
        isActive: true,
        order: 1,
      });
    }

    return { settings, session };
  } catch (error) {
    console.error(`Error initializing workspace for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = { initializeUserWorkspace };
