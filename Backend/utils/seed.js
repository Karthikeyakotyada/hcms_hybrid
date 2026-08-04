const User = require('../models/User');
const ApplicationSettings = require('../models/ApplicationSettings');

const seedInitialData = async () => {
  try {
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin122007';

    // 1. Ensure configured admin user exists
    let adminUser = await User.findOne({ username: adminUsername });
    if (!adminUser) {
      await User.create({
        username: adminUsername,
        password: adminPassword,
        name: 'Lead Organizer',
        role: 'organizer',
      });
      console.log(`Admin user created (Username: ${adminUsername})`);
    } else {
      // Update password to match env if changed
      adminUser.password = adminPassword;
      await adminUser.save();
      console.log(`Admin user '${adminUsername}' credentials updated.`);
    }

    // Also seed default organizer user if not exists
    let defaultOrganizer = await User.findOne({ username: 'organizer' });
    if (!defaultOrganizer && adminUsername !== 'organizer') {
      await User.create({
        username: 'organizer',
        password: 'admin123',
        name: 'Faculty Organizer',
        role: 'organizer',
      });
    }

    // 2. Seed Application Settings if not exists
    const settingsCount = await ApplicationSettings.countDocuments();
    if (settingsCount === 0) {
      await ApplicationSettings.create({
        currentRound: 'Round 1',
        isLocked: false,
        topTeamsCount: 3,
      });
      console.log('Default Application Settings initialized');
    }
  } catch (err) {
    console.error('Error seeding initial data:', err.message);
  }
};

module.exports = seedInitialData;
