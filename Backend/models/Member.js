const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
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
    unique: true,
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

memberSchema.index({ teamId: 1 });
memberSchema.index({ name: 1 });
memberSchema.index({ department: 1 });

module.exports = mongoose.model('Member', memberSchema);
