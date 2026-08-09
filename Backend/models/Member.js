const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  registerNumber: {
    type: String,
    required: true,
    trim: true,
  },
  department: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    default: '',
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
}, { timestamps: true });

memberSchema.index({ user: 1, registerNumber: 1 }, { unique: true });
memberSchema.index({ user: 1, teamId: 1 });
memberSchema.index({ user: 1, name: 1 });
memberSchema.index({ user: 1, department: 1 });

module.exports = mongoose.model('Member', memberSchema);
