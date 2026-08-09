const mongoose = require('mongoose');

const applicationSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
    unique: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  enableIndividualScoring: {
    type: Boolean,
    default: true,
  },
  topTeamsCount: {
    type: Number,
    default: 3,
    min: 1,
    max: 10,
  },
}, { timestamps: true });

module.exports = mongoose.model('ApplicationSettings', applicationSettingsSchema);
