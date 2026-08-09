const Team = require('../models/Team');
const Member = require('../models/Member');
const EvaluationScore = require('../models/EvaluationScore');

// @desc    Get all teams with search and pagination
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const minTeam = req.query.minTeam ? parseInt(req.query.minTeam, 10) : null;
    const maxTeam = req.query.maxTeam ? parseInt(req.query.maxTeam, 10) : null;
    const department = req.query.department ? req.query.department.trim() : '';

    let matchQuery = { user: userId };

    if (minTeam !== null && maxTeam !== null && !isNaN(minTeam) && !isNaN(maxTeam)) {
      const allowedNumbers = [];
      for (let i = minTeam; i <= maxTeam; i++) {
        allowedNumbers.push(String(i));
      }
      matchQuery.teamNumber = { $in: allowedNumbers };
    }

    if (department) {
      matchQuery.department = { $regex: department, $options: 'i' };
    }

    if (search) {
      const trimmed = search.trim();
      const cleanNum = trimmed.replace(/^t[-_\s]*/i, '').replace(/^0+/, '');
      const isNumeric = /^\d+$/.test(cleanNum) && cleanNum.length > 0;

      if (isNumeric) {
        const teamExists = await Team.exists({ teamNumber: cleanNum, user: userId });
        if (teamExists) {
          matchQuery.teamNumber = cleanNum;
        } else {
          const matchingMembers = await Member.find({
            user: userId,
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { registerNumber: { $regex: search, $options: 'i' } },
            ],
          }).select('teamId');

          const teamIdsFromMembers = matchingMembers.map((m) => m.teamId);

          matchQuery.$or = [
            { teamNumber: cleanNum },
            { teamName: { $regex: search, $options: 'i' } },
            { department: { $regex: search, $options: 'i' } },
            { _id: { $in: teamIdsFromMembers } },
          ];
        }
      } else {
        const matchingMembers = await Member.find({
          user: userId,
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { registerNumber: { $regex: search, $options: 'i' } },
          ],
        }).select('teamId');

        const teamIdsFromMembers = matchingMembers.map((m) => m.teamId);

        matchQuery.$or = [
          { teamNumber: { $regex: search, $options: 'i' } },
          { teamName: { $regex: search, $options: 'i' } },
          { department: { $regex: search, $options: 'i' } },
          { _id: { $in: teamIdsFromMembers } },
        ];
      }
    }

    const [totalTeams, teams] = await Promise.all([
      Team.countDocuments(matchQuery),
      Team.find(matchQuery)
        .populate('members')
        .collation({ locale: 'en', numericOrdering: true })
        .sort({ teamNumber: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json({
      teams,
      pagination: {
        total: totalTeams,
        page,
        limit,
        totalPages: Math.ceil(totalTeams / limit) || 1,
      },
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ message: 'Server error fetching teams', error: error.message });
  }
};

// @desc    Get single team details
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const userId = req.user._id;
    const [team, scores] = await Promise.all([
      Team.findOne({ _id: req.params.id, user: userId }).populate('members').lean(),
      EvaluationScore.find({ teamId: req.params.id, user: userId }).populate('roundId').lean(),
    ]);

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      team,
      scores,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching team details', error: error.message });
  }
};

// @desc    Create a new team with customizable member count (1 to N)
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamNumber, teamName, department, members } = req.body;

    if (!teamNumber || !teamName || !department) {
      return res.status(400).json({ message: 'Team number, name, and department are required' });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({ message: 'Team must have at least 1 member' });
    }

    const existingTeam = await Team.findOne({ teamNumber: teamNumber.trim(), user: userId });
    if (existingTeam) {
      return res.status(400).json({ message: `Team Number '${teamNumber}' already exists in your workspace` });
    }

    const regNumbersInRequest = new Set();
    for (let i = 0; i < members.length; i++) {
      const m = members[i];
      if (!m.name || !m.registerNumber || !m.department) {
        return res.status(400).json({
          message: `Member ${i + 1} requires Name, Register Number, and Department`,
        });
      }
      const reg = m.registerNumber.trim().toUpperCase();
      if (regNumbersInRequest.has(reg)) {
        return res.status(400).json({
          message: `Duplicate Register Number '${reg}' provided in team member list`,
        });
      }
      regNumbersInRequest.add(reg);
    }

    const existingMembers = await Member.find({
      user: userId,
      registerNumber: { $in: Array.from(regNumbersInRequest) },
    });
    if (existingMembers.length > 0) {
      const regList = existingMembers.map((m) => m.registerNumber).join(', ');
      return res.status(400).json({
        message: `Register Number(s) already registered in another team: ${regList}`,
      });
    }

    const newTeam = new Team({
      user: userId,
      teamNumber: teamNumber.trim(),
      teamName: teamName.trim(),
      department: department.trim(),
    });

    await newTeam.save();

    const createdMemberIds = [];
    for (const m of members) {
      const memberDoc = await Member.create({
        user: userId,
        teamId: newTeam._id,
        name: m.name.trim(),
        registerNumber: m.registerNumber.trim().toUpperCase(),
        department: m.department.trim(),
        email: m.email ? m.email.trim() : '',
        phone: m.phone ? m.phone.trim() : '',
      });
      createdMemberIds.push(memberDoc._id);
    }

    newTeam.members = createdMemberIds;
    await newTeam.save();

    const populatedTeam = await Team.findOne({ _id: newTeam._id, user: userId }).populate('members');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error creating team', error: error.message });
  }
};

// @desc    Update team details and customizable members (1 to N)
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teamNumber, teamName, department, members } = req.body;
    const teamId = req.params.id;

    const team = await Team.findOne({ _id: teamId, user: userId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    if (teamNumber && teamNumber.trim() !== team.teamNumber) {
      const dupTeam = await Team.findOne({ teamNumber: teamNumber.trim(), user: userId });
      if (dupTeam) {
        return res.status(400).json({ message: `Team Number '${teamNumber}' already exists in your workspace` });
      }
      team.teamNumber = teamNumber.trim();
    }

    if (teamName) team.teamName = teamName.trim();
    if (department) team.department = department.trim();

    if (members) {
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ message: 'Team must have at least 1 member' });
      }

      const currentMemberIds = team.members.map((id) => id.toString());
      const regNumbersInRequest = new Set();

      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        if (!m.name || !m.registerNumber || !m.department) {
          return res.status(400).json({
            message: `Member ${i + 1} requires Name, Register Number, and Department`,
          });
        }
        const reg = m.registerNumber.trim().toUpperCase();
        if (regNumbersInRequest.has(reg)) {
          return res.status(400).json({
            message: `Duplicate Register Number '${reg}' in member list`,
          });
        }
        regNumbersInRequest.add(reg);

        const existing = await Member.findOne({
          user: userId,
          registerNumber: reg,
          _id: { $nin: currentMemberIds },
        });
        if (existing) {
          return res.status(400).json({
            message: `Register Number '${reg}' already belongs to another team`,
          });
        }
      }

      // Track kept member IDs to delete removed ones
      const finalMemberIds = [];

      for (let i = 0; i < members.length; i++) {
        const mData = members[i];
        if (mData._id && currentMemberIds.includes(mData._id.toString())) {
          await Member.findOneAndUpdate(
            { _id: mData._id, user: userId },
            {
              name: mData.name.trim(),
              registerNumber: mData.registerNumber.trim().toUpperCase(),
              department: mData.department.trim(),
              email: mData.email ? mData.email.trim() : '',
              phone: mData.phone ? mData.phone.trim() : '',
            }
          );
          finalMemberIds.push(mData._id);
        } else {
          // Create new member added during edit
          const newMemberDoc = await Member.create({
            user: userId,
            teamId: team._id,
            name: mData.name.trim(),
            registerNumber: mData.registerNumber.trim().toUpperCase(),
            department: mData.department.trim(),
            email: mData.email ? mData.email.trim() : '',
            phone: mData.phone ? mData.phone.trim() : '',
          });
          finalMemberIds.push(newMemberDoc._id);
        }
      }

      // Delete members that were removed from the team
      const stringFinalIds = finalMemberIds.map((id) => id.toString());
      const membersToDelete = currentMemberIds.filter((id) => !stringFinalIds.includes(id));
      if (membersToDelete.length > 0) {
        await Member.deleteMany({ _id: { $in: membersToDelete }, user: userId });
      }

      team.members = finalMemberIds;
    }

    await team.save();

    const updatedTeam = await Team.findOne({ _id: teamId, user: userId }).populate('members');
    res.json(updatedTeam);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating team', error: error.message });
  }
};

// @desc    Delete team and associated members and scores
// @route   DELETE /api/teams/:id
// @access  Private
const deleteTeam = async (req, res) => {
  try {
    const userId = req.user._id;
    const teamId = req.params.id;
    const team = await Team.findOne({ _id: teamId, user: userId });
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    await Member.deleteMany({ teamId, user: userId });
    await EvaluationScore.deleteMany({ teamId, user: userId });
    await Team.findOneAndDelete({ _id: teamId, user: userId });

    res.json({ message: `Team ${team.teamNumber} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting team', error: error.message });
  }
};

// @desc    Bulk import teams with flexible member count per team
// @route   POST /api/teams/bulk-import
// @access  Private
const bulkImportTeams = async (req, res) => {
  try {
    const userId = req.user._id;
    const { teams } = req.body;
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ message: 'Valid non-empty array of teams is required' });
    }

    let createdCount = 0;
    const errors = [];

    for (let index = 0; index < teams.length; index++) {
      const t = teams[index];
      try {
        if (!t.teamNumber || !t.teamName || !t.department || !t.members || !Array.isArray(t.members) || t.members.length === 0) {
          errors.push(`Row ${index + 1}: Team must have teamNumber, teamName, department, and at least 1 member.`);
          continue;
        }

        const existingTeam = await Team.findOne({ teamNumber: t.teamNumber.trim(), user: userId });
        if (existingTeam) {
          errors.push(`Row ${index + 1}: Team Number '${t.teamNumber}' already exists.`);
          continue;
        }

        const newTeam = await Team.create({
          user: userId,
          teamNumber: t.teamNumber.trim(),
          teamName: t.teamName.trim(),
          department: t.department.trim(),
        });

        const memberIds = [];
        for (const m of t.members) {
          const memberDoc = await Member.create({
            user: userId,
            teamId: newTeam._id,
            name: m.name.trim(),
            registerNumber: m.registerNumber.trim().toUpperCase(),
            department: m.department ? m.department.trim() : t.department.trim(),
            email: m.email ? m.email.trim() : '',
            phone: m.phone ? m.phone.trim() : '',
          });
          memberIds.push(memberDoc._id);
        }

        newTeam.members = memberIds;
        await newTeam.save();
        createdCount++;
      } catch (err) {
        errors.push(`Row ${index + 1}: ${err.message}`);
      }
    }

    res.json({
      message: `Bulk import completed. Successfully imported ${createdCount} teams.`,
      createdCount,
      errors,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error during bulk import', error: error.message });
  }
};

module.exports = {
  getTeams,
  getTeamById,
  createTeam,
  updateTeam,
  deleteTeam,
  bulkImportTeams,
};
