const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamNumber: {
    type: String,
    required: true,
    unique: true,
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

teamSchema.index({ department: 1 });
teamSchema.index({ teamName: 1 });

module.exports = mongoose.model('Team', teamSchema);
