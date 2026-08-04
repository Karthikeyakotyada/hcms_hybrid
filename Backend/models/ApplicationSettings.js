const mongoose = require('mongoose');

const applicationSettingsSchema = new mongoose.Schema({
  currentRound: {
    type: String,
    enum: ['Round 1', 'Round 2', 'Completed'],
    default: 'Round 1',
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  topTeamsCount: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
}, { timestamps: true });

module.exports = mongoose.model('ApplicationSettings', applicationSettingsSchema);
