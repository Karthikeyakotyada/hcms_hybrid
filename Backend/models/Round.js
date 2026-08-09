const mongoose = require('mongoose');

const roundSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  order: {
    type: Number,
    default: 1,
  },
  weight: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

roundSchema.index({ user: 1, order: 1 });
roundSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('Round', roundSchema);
