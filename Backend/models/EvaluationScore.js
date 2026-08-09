const mongoose = require('mongoose');

const evaluationScoreSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
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
    max: 50,
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

evaluationScoreSchema.index({ user: 1, roundId: 1, teamId: 1 }, { unique: true });
evaluationScoreSchema.index({ user: 1, teamId: 1 });
evaluationScoreSchema.index({ user: 1, roundId: 1 });

module.exports = mongoose.model('EvaluationScore', evaluationScoreSchema);
