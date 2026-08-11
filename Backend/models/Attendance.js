const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
  },
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  registerNumber: {
    type: String,
    required: true,
    trim: true,
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AttendanceSession',
    required: true,
  },
  sessionName: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['PRESENT', 'ABSENT'],
    required: true,
    default: 'PRESENT',
  },
  method: {
    type: String,
    enum: ['SCAN', 'MANUAL'],
    required: true,
    default: 'SCAN',
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

// Enforce single attendance record per participant per session in a workspace
attendanceSchema.index({ user: 1, memberId: 1, sessionId: 1 }, { unique: true });
attendanceSchema.index({ user: 1, sessionId: 1, status: 1 });
attendanceSchema.index({ user: 1, teamId: 1, sessionId: 1 });
attendanceSchema.index({ user: 1, registerNumber: 1, sessionId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
