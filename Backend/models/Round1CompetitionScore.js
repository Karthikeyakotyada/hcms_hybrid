const mongoose = require('mongoose');

const round1CompetitionScoreSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
    unique: true,
  },
  score: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  comments: {
    type: String,
    trim: true,
    default: '',
  },
  updatedBy: {
    type: String,
    default: 'Organizer',
  },
}, { timestamps: true });

module.exports = mongoose.model('Round1CompetitionScore', round1CompetitionScoreSchema);
