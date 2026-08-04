const mongoose = require('mongoose');

const round2IndividualScoreSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  updatedBy: {
    type: String,
    default: 'Organizer',
  },
}, { timestamps: true });

round2IndividualScoreSchema.index({ teamId: 1, memberId: 1 }, { unique: true });

module.exports = mongoose.model('Round2IndividualScore', round2IndividualScoreSchema);
