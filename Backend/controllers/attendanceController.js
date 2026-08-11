const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');
const Member = require('../models/Member');
const Team = require('../models/Team');

/**
 * Helper to ensure at least one active AttendanceSession exists for the user.
 */
const getOrCreateActiveSession = async (userId) => {
  let session = await AttendanceSession.findOne({ user: userId, isActive: true }).lean();
  if (!session) {
    session = await AttendanceSession.findOne({ user: userId }).sort({ order: 1, createdAt: 1 }).lean();
  }
  if (!session) {
    session = await AttendanceSession.create({
      user: userId,
      name: 'Event Check-in',
      description: 'Main event check-in and registration scan',
      isActive: true,
      order: 1,
    });
  }
  return session;
};

// @desc    Process ID card barcode/QR scan
// @route   POST /api/attendance/scan
// @access  Private
const scanAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { registerNumber, sessionId } = req.body;

    if (!registerNumber || typeof registerNumber !== 'string' || !registerNumber.trim()) {
      return res.status(400).json({ message: 'Registration number is required' });
    }

    const cleanReg = registerNumber.trim();

    // Determine target session
    let session;
    if (sessionId) {
      session = await AttendanceSession.findOne({ _id: sessionId, user: userId });
      if (!session) {
        return res.status(404).json({ message: 'Attendance session not found' });
      }
    } else {
      session = await getOrCreateActiveSession(userId);
    }

    // Lookup participant
    const escaped = cleanReg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const member = await Member.findOne({
      user: userId,
      registerNumber: { $regex: new RegExp(`^${escaped}$`, 'i') },
    }).populate('teamId');

    if (!member) {
      return res.status(404).json({
        message: `Participant not found with Registration Number: ${cleanReg}`,
        registerNumber: cleanReg,
      });
    }

    // Check duplicate attendance for this session
    const existing = await Attendance.findOne({
      user: userId,
      memberId: member._id,
      sessionId: session._id,
    });

    if (existing) {
      return res.status(409).json({
        message: `Participant already marked ${existing.status} for session "${session.name}"`,
        status: 'ALREADY_MARKED',
        attendance: existing,
        member: {
          _id: member._id,
          name: member.name,
          registerNumber: member.registerNumber,
          department: member.department,
        },
        team: member.teamId ? {
          _id: member.teamId._id,
          teamNumber: member.teamId.teamNumber,
          teamName: member.teamId.teamName,
        } : null,
        session: {
          _id: session._id,
          name: session.name,
        },
      });
    }

    // Create new attendance record: Scans ONLY create PRESENT records
    const attendance = await Attendance.create({
      user: userId,
      memberId: member._id,
      teamId: member.teamId ? member.teamId._id : null,
      registerNumber: member.registerNumber,
      sessionId: session._id,
      sessionName: session.name,
      status: 'PRESENT',
      method: 'SCAN',
      scannedAt: new Date(),
    });

    res.status(201).json({
      message: 'Attendance recorded successfully',
      status: 'SUCCESS',
      attendance,
      member: {
        _id: member._id,
        name: member.name,
        registerNumber: member.registerNumber,
        department: member.department,
      },
      team: member.teamId ? {
        _id: member.teamId._id,
        teamNumber: member.teamId.teamNumber,
        teamName: member.teamId.teamName,
      } : null,
      session: {
        _id: session._id,
        name: session.name,
      },
    });
  } catch (error) {
    console.error('Error scanning attendance:', error);
    res.status(500).json({ message: 'Server error recording attendance', error: error.message });
  }
};

// @desc    Manually mark attendance (PRESENT, ABSENT, or reset to NOT_MARKED by removing record)
// @route   POST /api/attendance/mark
// @access  Private
const manualMarkAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { memberId, sessionId, status } = req.body;

    if (!memberId) {
      return res.status(400).json({ message: 'Member ID is required' });
    }

    // Determine target session
    let session;
    if (sessionId) {
      session = await AttendanceSession.findOne({ _id: sessionId, user: userId });
      if (!session) {
        return res.status(404).json({ message: 'Attendance session not found' });
      }
    } else {
      session = await getOrCreateActiveSession(userId);
    }

    const member = await Member.findOne({ _id: memberId, user: userId }).populate('teamId');
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Resetting to NOT_MARKED means deleting/removing the attendance record
    if (status === 'NOT_MARKED' || status === null || status === '' || status === 'REMOVE') {
      await Attendance.deleteOne({
        user: userId,
        memberId: member._id,
        sessionId: session._id,
      });

      return res.json({
        message: 'Attendance reset to Not Marked',
        status: 'NOT_MARKED',
        memberId: member._id,
        sessionId: session._id,
      });
    }

    // Otherwise status must be PRESENT or ABSENT
    const upperStatus = String(status).toUpperCase();
    if (!['PRESENT', 'ABSENT'].includes(upperStatus)) {
      return res.status(400).json({ message: 'Status must be either PRESENT, ABSENT, or NOT_MARKED' });
    }

    const attendance = await Attendance.findOneAndUpdate(
      {
        user: userId,
        memberId: member._id,
        sessionId: session._id,
      },
      {
        $set: {
          teamId: member.teamId ? member.teamId._id : null,
          registerNumber: member.registerNumber,
          sessionName: session.name,
          status: upperStatus,
          method: 'MANUAL',
          scannedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      message: `Attendance marked as ${upperStatus}`,
      status: upperStatus,
      attendance,
      member: {
        _id: member._id,
        name: member.name,
        registerNumber: member.registerNumber,
      },
    });
  } catch (error) {
    console.error('Error marking manual attendance:', error);
    res.status(500).json({ message: 'Server error marking attendance', error: error.message });
  }
};

// @desc    Get attendance list with filters, search, pagination & stats
// @route   GET /api/attendance
// @access  Private
const getAttendanceList = async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      sessionId,
      status = 'ALL',
      method = 'ALL',
      search = '',
      department = '',
      page = 1,
      limit = 20,
    } = req.query;

    let session;
    if (sessionId) {
      session = await AttendanceSession.findOne({ _id: sessionId, user: userId }).lean();
      if (!session) {
        session = await getOrCreateActiveSession(userId);
      }
    } else {
      session = await getOrCreateActiveSession(userId);
    }

    // Query all members & teams for user
    const [allMembers, allAttendance] = await Promise.all([
      Member.find({ user: userId }).populate('teamId').sort({ registerNumber: 1 }).lean(),
      Attendance.find({ user: userId, sessionId: session._id }).lean(),
    ]);

    const attendanceMap = new Map();
    allAttendance.forEach((att) => {
      attendanceMap.set(att.memberId.toString(), att);
    });

    // Compute overall session stats across all participants
    const totalParticipants = allMembers.length;
    let presentCount = 0;
    let absentCount = 0;

    allAttendance.forEach((att) => {
      if (att.status === 'PRESENT') presentCount++;
      else if (att.status === 'ABSENT') absentCount++;
    });

    const notMarkedCount = Math.max(0, totalParticipants - presentCount - absentCount);
    const attendanceRate = totalParticipants > 0 ? ((presentCount / totalParticipants) * 100).toFixed(1) : '0.0';

    // Map each member to an attendance row
    let rows = allMembers.map((m) => {
      const att = attendanceMap.get(m._id.toString());
      return {
        memberId: m._id,
        name: m.name,
        registerNumber: m.registerNumber,
        department: m.department,
        email: m.email || '',
        phone: m.phone || '',
        team: m.teamId ? {
          _id: m.teamId._id,
          teamNumber: m.teamId.teamNumber,
          teamName: m.teamId.teamName,
          department: m.teamId.department,
        } : null,
        status: att ? att.status : 'NOT_MARKED',
        method: att ? att.method : null,
        scannedAt: att ? att.scannedAt : null,
        attendanceId: att ? att._id : null,
      };
    });

    // Apply search filter (registerNumber, name, teamNumber, teamName)
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((r) =>
        r.name.toLowerCase().includes(q) ||
        r.registerNumber.toLowerCase().includes(q) ||
        (r.team && (
          r.team.teamNumber.toLowerCase().includes(q) ||
          r.team.teamName.toLowerCase().includes(q)
        ))
      );
    }

    // Apply department filter
    if (department && department.trim()) {
      const depQ = department.trim().toLowerCase();
      rows = rows.filter((r) => r.department && r.department.toLowerCase().includes(depQ));
    }

    // Apply status filter ('PRESENT', 'ABSENT', 'NOT_MARKED')
    if (status && status !== 'ALL') {
      const filterStatus = status.toUpperCase();
      rows = rows.filter((r) => r.status === filterStatus);
    }

    // Apply method filter ('SCAN', 'MANUAL')
    if (method && method !== 'ALL') {
      const filterMethod = method.toUpperCase();
      rows = rows.filter((r) => r.method === filterMethod);
    }

    // Pagination
    const totalFiltered = rows.length;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const totalPages = Math.ceil(totalFiltered / limitNum) || 1;
    const paginatedRows = rows.slice((pageNum - 1) * limitNum, pageNum * limitNum);

    res.json({
      rows: paginatedRows,
      session,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        totalPages,
        limit: limitNum,
      },
      stats: {
        totalParticipants,
        presentCount,
        absentCount,
        notMarkedCount,
        attendanceRate: parseFloat(attendanceRate),
      },
    });
  } catch (error) {
    console.error('Error fetching attendance list:', error);
    res.status(500).json({ message: 'Server error fetching attendance', error: error.message });
  }
};

// @desc    Get attendance summary stats for dashboard & scanner
// @route   GET /api/attendance/stats
// @access  Private
const getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const { sessionId } = req.query;

    let session;
    if (sessionId) {
      session = await AttendanceSession.findOne({ _id: sessionId, user: userId }).lean();
    }
    if (!session) {
      session = await getOrCreateActiveSession(userId);
    }

    const [totalParticipants, allAttendance, recentScans, teams, allMembers] = await Promise.all([
      Member.countDocuments({ user: userId }),
      Attendance.find({ user: userId, sessionId: session._id }).lean(),
      Attendance.find({ user: userId, sessionId: session._id, status: 'PRESENT' })
        .sort({ scannedAt: -1 })
        .limit(5)
        .populate('memberId')
        .populate('teamId')
        .lean(),
      Team.find({ user: userId }).populate('members').lean(),
      Member.find({ user: userId }).select('_id teamId').lean(),
    ]);

    let presentCount = 0;
    let absentCount = 0;
    allAttendance.forEach((att) => {
      if (att.status === 'PRESENT') presentCount++;
      else if (att.status === 'ABSENT') absentCount++;
    });

    const notMarkedCount = Math.max(0, totalParticipants - presentCount - absentCount);
    const attendanceRate = totalParticipants > 0 ? ((presentCount / totalParticipants) * 100).toFixed(1) : '0.0';

    // Team breakdown map
    const teamAttendanceMap = new Map();
    allAttendance.forEach((att) => {
      if (att.teamId) {
        const tIdStr = att.teamId.toString();
        if (!teamAttendanceMap.has(tIdStr)) {
          teamAttendanceMap.set(tIdStr, { present: 0, absent: 0 });
        }
        const data = teamAttendanceMap.get(tIdStr);
        if (att.status === 'PRESENT') data.present++;
        else if (att.status === 'ABSENT') data.absent++;
      }
    });

    const teamBreakdown = teams.map((team) => {
      const memberCount = team.members ? team.members.length : 0;
      const attData = teamAttendanceMap.get(team._id.toString()) || { present: 0, absent: 0 };
      const teamPresent = attData.present;
      const teamAbsent = attData.absent;
      const teamNotMarked = Math.max(0, memberCount - teamPresent - teamAbsent);
      const teamRate = memberCount > 0 ? Math.round((teamPresent / memberCount) * 100) : 0;

      return {
        teamId: team._id,
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        department: team.department,
        totalMembers: memberCount,
        presentCount: teamPresent,
        absentCount: teamAbsent,
        notMarkedCount: teamNotMarked,
        attendanceRate: teamRate,
      };
    });

    res.json({
      session,
      totalParticipants,
      presentCount,
      absentCount,
      notMarkedCount,
      attendanceRate: parseFloat(attendanceRate),
      recentScans: recentScans.map((s) => ({
        _id: s._id,
        name: s.memberId ? s.memberId.name : 'Unknown',
        registerNumber: s.registerNumber,
        teamNumber: s.teamId ? s.teamId.teamNumber : '-',
        teamName: s.teamId ? s.teamId.teamName : '-',
        scannedAt: s.scannedAt,
        method: s.method,
      })),
      teamBreakdown,
    });
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Server error fetching attendance stats', error: error.message });
  }
};

// @desc    Get all attendance sessions for user
// @route   GET /api/attendance/sessions
// @access  Private
const getSessions = async (req, res) => {
  try {
    const userId = req.user._id;
    let sessions = await AttendanceSession.find({ user: userId }).sort({ order: 1, createdAt: 1 }).lean();
    if (sessions.length === 0) {
      await getOrCreateActiveSession(userId);
      sessions = await AttendanceSession.find({ user: userId }).sort({ order: 1, createdAt: 1 }).lean();
    }
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching sessions', error: error.message });
  }
};

// @desc    Create new attendance session
// @route   POST /api/attendance/sessions
// @access  Private
const createSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, makeActive } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Session name is required' });
    }

    if (makeActive) {
      await AttendanceSession.updateMany({ user: userId }, { isActive: false });
    }

    const sessionCount = await AttendanceSession.countDocuments({ user: userId });

    const newSession = await AttendanceSession.create({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      isActive: makeActive || sessionCount === 0,
      order: sessionCount + 1,
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(500).json({ message: 'Server error creating session', error: error.message });
  }
};

// @desc    Update an attendance session
// @route   PUT /api/attendance/sessions/:id
// @access  Private
const updateSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (isActive) {
      await AttendanceSession.updateMany({ user: userId, _id: { $ne: id } }, { isActive: false });
    }

    const updateFields = {};
    if (name) updateFields.name = name.trim();
    if (description !== undefined) updateFields.description = description.trim();
    if (isActive !== undefined) updateFields.isActive = isActive;

    const session = await AttendanceSession.findOneAndUpdate(
      { _id: id, user: userId },
      { $set: updateFields },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating session', error: error.message });
  }
};

// @desc    Delete an attendance session and its attendance records
// @route   DELETE /api/attendance/sessions/:id
// @access  Private
const deleteSession = async (req, res) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const totalSessions = await AttendanceSession.countDocuments({ user: userId });
    if (totalSessions <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only attendance session. Create another first.' });
    }

    const session = await AttendanceSession.findOneAndDelete({ _id: id, user: userId });
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Delete associated attendance records
    await Attendance.deleteMany({ user: userId, sessionId: id });

    // If active session was deleted, set first remaining as active
    if (session.isActive) {
      const nextActive = await AttendanceSession.findOne({ user: userId }).sort({ order: 1 });
      if (nextActive) {
        nextActive.isActive = true;
        await nextActive.save();
      }
    }

    res.json({ message: 'Session and its attendance records deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting session', error: error.message });
  }
};

// @desc    Get participant attendance history across all sessions
// @route   GET /api/attendance/participant/:memberId
// @access  Private
const getParticipantHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { memberId } = req.params;

    const member = await Member.findOne({ _id: memberId, user: userId }).populate('teamId').lean();
    if (!member) {
      return res.status(404).json({ message: 'Participant not found' });
    }

    const [sessions, records] = await Promise.all([
      AttendanceSession.find({ user: userId }).sort({ order: 1 }).lean(),
      Attendance.find({ user: userId, memberId }).lean(),
    ]);

    const recordMap = new Map();
    records.forEach((r) => recordMap.set(r.sessionId.toString(), r));

    const history = sessions.map((s) => {
      const rec = recordMap.get(s._id.toString());
      return {
        sessionId: s._id,
        sessionName: s.name,
        status: rec ? rec.status : 'NOT_MARKED',
        method: rec ? rec.method : null,
        scannedAt: rec ? rec.scannedAt : null,
      };
    });

    res.json({
      member: {
        _id: member._id,
        name: member.name,
        registerNumber: member.registerNumber,
        department: member.department,
        team: member.teamId ? {
          _id: member.teamId._id,
          teamNumber: member.teamId.teamNumber,
          teamName: member.teamId.teamName,
        } : null,
      },
      history,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching participant history', error: error.message });
  }
};

// @desc    Get team attendance summary
// @route   GET /api/attendance/team/:teamId
// @access  Private
const getTeamAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamId } = req.params;
    const { sessionId } = req.query;

    let session;
    if (sessionId) {
      session = await AttendanceSession.findOne({ _id: sessionId, user: userId }).lean();
    }
    if (!session) {
      session = await getOrCreateActiveSession(userId);
    }

    const team = await Team.findOne({ _id: teamId, user: userId }).populate('members').lean();
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const memberIds = team.members ? team.members.map((m) => m._id) : [];
    const records = await Attendance.find({
      user: userId,
      sessionId: session._id,
      memberId: { $in: memberIds },
    }).lean();

    const recordMap = new Map();
    records.forEach((r) => recordMap.set(r.memberId.toString(), r));

    let presentCount = 0;
    let absentCount = 0;

    const membersWithAttendance = (team.members || []).map((m) => {
      const rec = recordMap.get(m._id.toString());
      const status = rec ? rec.status : 'NOT_MARKED';
      if (status === 'PRESENT') presentCount++;
      else if (status === 'ABSENT') absentCount++;

      return {
        _id: m._id,
        name: m.name,
        registerNumber: m.registerNumber,
        department: m.department,
        status,
        method: rec ? rec.method : null,
        scannedAt: rec ? rec.scannedAt : null,
      };
    });

    const totalMembers = membersWithAttendance.length;
    const notMarkedCount = Math.max(0, totalMembers - presentCount - absentCount);

    res.json({
      team: {
        _id: team._id,
        teamNumber: team.teamNumber,
        teamName: team.teamName,
        department: team.department,
      },
      session,
      members: membersWithAttendance,
      summary: {
        total: totalMembers,
        present: presentCount,
        absent: absentCount,
        notMarked: notMarkedCount,
        attendanceRate: totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching team attendance', error: error.message });
  }
};

// @desc    Get master attendance report matrix across all sessions
// @route   GET /api/attendance/export/all
// @access  Private
const getAllSessionsAttendanceReport = async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all sessions ordered
    const sessions = await AttendanceSession.find({ user: userId })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    // Get all members with populated teams
    const members = await Member.find({ user: userId })
      .populate('teamId')
      .sort({ 'teamId.teamNumber': 1, name: 1 })
      .lean();

    // Get all attendance records for this user
    const records = await Attendance.find({ user: userId }).lean();

    // Map by `memberId_sessionId`
    const attMap = new Map();
    for (const rec of records) {
      attMap.set(`${rec.memberId.toString()}_${rec.sessionId.toString()}`, rec);
    }

    // Build participant matrix rows
    const matrix = members.map((m) => {
      const row = {
        memberId: m._id,
        name: m.name,
        registerNumber: m.registerNumber,
        department: m.department || '-',
        teamNumber: m.teamId ? m.teamId.teamNumber : '-',
        teamName: m.teamId ? m.teamId.teamName : '-',
        sessions: {},
      };

      let presentCount = 0;
      let absentCount = 0;
      let notMarkedCount = 0;
      let latestScan = null;

      for (const s of sessions) {
        const key = `${m._id.toString()}_${s._id.toString()}`;
        const rec = attMap.get(key);
        const status = rec ? rec.status : 'NOT_MARKED';
        const method = rec ? rec.method : null;
        const scannedAt = rec ? rec.scannedAt || rec.updatedAt || rec.createdAt : null;

        if (scannedAt) {
          if (!latestScan || new Date(scannedAt) > new Date(latestScan)) {
            latestScan = scannedAt;
          }
        }

        let statusText = 'Not Marked';
        if (status === 'PRESENT') {
          presentCount++;
          statusText = method === 'SCAN' ? 'Present (Scan)' : 'Present (Manual)';
        } else if (status === 'ABSENT') {
          absentCount++;
          statusText = 'Absent';
        } else {
          notMarkedCount++;
        }

        row.sessions[s.name] = {
          status: statusText,
          scannedAt: scannedAt,
        };
      }

      const totalSessions = sessions.length;
      row.presentCount = presentCount;
      row.absentCount = absentCount;
      row.notMarkedCount = notMarkedCount;
      row.totalSessions = totalSessions;
      row.lastScannedAt = latestScan;
      row.attendanceSummary = `${presentCount} / ${totalSessions}`;
      row.attendanceRate = totalSessions > 0 ? `${Math.round((presentCount / totalSessions) * 100)}%` : '0%';

      return row;
    });

    res.json({
      sessions: sessions.map((s) => ({ _id: s._id, name: s.name, isActive: s.isActive })),
      totalMembers: members.length,
      matrix,
    });
  } catch (error) {
    console.error('Error generating all-sessions attendance report:', error);
    res.status(500).json({ message: 'Server error generating all-sessions attendance report', error: error.message });
  }
};

module.exports = {
  scanAttendance,
  manualMarkAttendance,
  getAttendanceList,
  getAttendanceStats,
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getParticipantHistory,
  getTeamAttendance,
  getAllSessionsAttendanceReport,
};
