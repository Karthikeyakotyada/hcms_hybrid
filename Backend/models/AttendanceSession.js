const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
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
    trim: true,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 1,
  },
}, { timestamps: true });

attendanceSessionSchema.index({ user: 1, name: 1 });
attendanceSessionSchema.index({ user: 1, isActive: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
