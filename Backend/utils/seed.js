const mongoose = require('mongoose');
const User = require('../models/User');
const Team = require('../models/Team');
const Member = require('../models/Member');
const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');
const ApplicationSettings = require('../models/ApplicationSettings');
const { initializeUserWorkspace } = require('./userWorkspace');

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

      // 2. Drop old non-tenant indexes on active collections to prevent index conflicts
      const indexDropOps = [
        { coll: 'teams', indexName: 'teamNumber_1' },
        { coll: 'members', indexName: 'registerNumber_1' },
        { coll: 'evaluationscores', indexName: 'roundId_1_teamId_1' },
      ];

      for (const op of indexDropOps) {
        if (existingCollections.includes(op.coll)) {
          try {
            const indexes = await mongoose.connection.db.collection(op.coll).indexes();
            if (indexes.some((idx) => idx.name === op.indexName)) {
              await mongoose.connection.db.collection(op.coll).dropIndex(op.indexName);
              console.log(`Dropped legacy single-tenant index '${op.indexName}' on '${op.coll}'`);
            }
          } catch (idxErr) {
            // Index might already not exist
          }
        }
      }
    }

    // 3. Ensure admin user exists
    const adminUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin152007';

    let adminUser = await User.findOne({ username: adminUsername });
    if (!adminUser) {
      adminUser = await User.create({
        username: adminUsername,
        password: adminPassword,
        name: 'Lead Organizer',
        organization: 'Admin Department',
        role: 'organizer',
      });
      console.log(`Admin user created (Username: ${adminUsername})`);
    } else {
      adminUser.password = adminPassword;
      await adminUser.save();
    }

    // Seed secondary organizer if configured
    let defaultOrganizer = await User.findOne({ username: 'organizer' });
    if (!defaultOrganizer && adminUsername !== 'organizer') {
      defaultOrganizer = await User.create({
        username: 'organizer',
        password: 'admin123',
        name: 'Faculty Organizer',
        organization: 'Faculty Coordinator',
        role: 'organizer',
      });
      await initializeUserWorkspace(defaultOrganizer._id);
    }

    // 4. Migrate any existing unassigned data to the admin user
    const unassignedFilter = { $or: [{ user: { $exists: false } }, { user: null }] };

    const [teamsUpdated, membersUpdated, roundsUpdated, scoresUpdated, settingsUpdated] = await Promise.all([
      Team.updateMany(unassignedFilter, { $set: { user: adminUser._id } }),
      Member.updateMany(unassignedFilter, { $set: { user: adminUser._id } }),
      Round.updateMany(unassignedFilter, { $set: { user: adminUser._id } }),
      EvaluationScore.updateMany(unassignedFilter, { $set: { user: adminUser._id } }),
      ApplicationSettings.updateMany(unassignedFilter, { $set: { user: adminUser._id } }),
    ]);

    if (teamsUpdated.modifiedCount > 0) {
      console.log(`Migrated ${teamsUpdated.modifiedCount} legacy teams to admin user.`);
    }

    // 5. Ensure admin workspace has initial settings & rounds
    await initializeUserWorkspace(adminUser._id);
    console.log('Multi-tenant data seeding & migration completed successfully.');
  } catch (err) {
    console.error('Error seeding initial data & cleaning DB:', err.message);
  }
};

module.exports = seedInitialData;
