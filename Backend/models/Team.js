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
  guideName: {
    type: String,
    trim: true,
    default: '',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
  }],
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);
