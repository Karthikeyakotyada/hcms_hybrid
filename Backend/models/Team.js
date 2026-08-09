const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  teamNumber: {
    type: String,
    required: true,
    trim: true,
  },
  teamName: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  }],
}, { timestamps: true });

teamSchema.index({ user: 1, teamNumber: 1 }, { unique: true });
teamSchema.index({ user: 1, department: 1 });
teamSchema.index({ user: 1, teamName: 1 });

module.exports = mongoose.model('Team', teamSchema);
