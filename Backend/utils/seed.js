const mongoose = require('mongoose');
const User = require('../models/User');
const ApplicationSettings = require('../models/ApplicationSettings');
const Round = require('../models/Round');

const seedInitialData = async () => {
  try {
    // 1. Clean up old/obsolete MongoDB collections if present
    const collectionsToDrop = [
      'activitylogs',
      'round1competitionscores',
      'round1individualscores',
      'round2competitionscores',
      'round2individualscores',
      'competitionscores',
      'individualscores',
      'evaluationrounds',
    ];

    if (mongoose.connection && mongoose.connection.db) {
      const existingCollections = (await mongoose.connection.db.listCollections().toArray()).map((c) => c.name);
      for (const collName of collectionsToDrop) {
        if (existingCollections.includes(collName)) {
          try {
            await mongoose.connection.db.collection(collName).drop();
            console.log(`Dropped obsolete DB collection: ${collName}`);
          } catch (e) {
            // Ignore error if drop fails
          }
        }
      }
    }

    // 2. Ensure admin user exists
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin122007';

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
      adminUser.password = adminPassword;
      await adminUser.save();
    }

    // Seed default organizer
    let defaultOrganizer = await User.findOne({ username: 'organizer' });
    if (!defaultOrganizer && adminUsername !== 'organizer') {
      await User.create({
        username: 'organizer',
        password: 'admin123',
        name: 'Faculty Organizer',
        role: 'organizer',
      });
    }

    // 3. Seed Application Settings
    const settingsCount = await ApplicationSettings.countDocuments();
    if (settingsCount === 0) {
      await ApplicationSettings.create({
        isLocked: false,
        topTeamsCount: 3,
      });
      console.log('Default Application Settings initialized');
    }

    // 4. Seed Default Evaluation Rounds if empty
    const roundsCount = await Round.countDocuments();
    if (roundsCount === 0) {
      await Round.create([
        { name: 'Round 1 - Technical Pitch', description: 'Initial idea & technical presentation evaluation', order: 1, weight: 1 },
        { name: 'Round 2 - Final Prototype', description: 'Working prototype and code implementation quality', order: 2, weight: 1.5 },
      ]);
      console.log('Default Evaluation Rounds seeded into DB');
    }
  } catch (err) {
    console.error('Error seeding initial data & cleaning DB:', err.message);
  }
};

module.exports = seedInitialData;
