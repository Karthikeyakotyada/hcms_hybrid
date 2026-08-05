const mongoose = require('mongoose');

const evaluationScoreSchema = new mongoose.Schema({
  roundId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Round',
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  teamScore: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
  },
  comments: {
    type: String,
    default: '',
  },
  individualScores: [
    {
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member',
        required: true,
      },
      score: {
        type: Number,
        min: 1,
        max: 100,
      },
    },
  ],
  updatedBy: {
    type: String,
    default: 'Organizer',
  },
}, { timestamps: true });

evaluationScoreSchema.index({ roundId: 1, teamId: 1 }, { unique: true });

module.exports = mongoose.model('EvaluationScore', evaluationScoreSchema);
