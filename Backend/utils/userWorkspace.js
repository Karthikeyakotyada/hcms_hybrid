const ApplicationSettings = require('../models/ApplicationSettings');

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

    // No dummy rounds are created by default.
    // The user has full freedom to create their own custom rounds in Evaluation/Settings.

    return { settings };
  } catch (error) {
    console.error(`Error initializing workspace for user ${userId}:`, error.message);
    throw error;
  }
};

module.exports = { initializeUserWorkspace };
