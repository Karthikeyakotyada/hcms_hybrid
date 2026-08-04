const Team = require('../models/Team');
const Member = require('../models/Member');
const Round1IndividualScore = require('../models/Round1IndividualScore');
const Round2IndividualScore = require('../models/Round2IndividualScore');
const Round1CompetitionScore = require('../models/Round1CompetitionScore');
const Round2CompetitionScore = require('../models/Round2CompetitionScore');
const { logActivity } = require('../utils/activityLogger');

// @desc    Get all teams with search and pagination
// @route   GET /api/teams
// @access  Private
const getTeams = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search ? req.query.search.trim() : '';
    const department = req.query.department ? req.query.department.trim() : '';

    let matchQuery = {};

    if (department) {
      matchQuery.department = { $regex: department, $options: 'i' };
    }

    if (search) {
      // Find members matching name or registerNumber
      const matchingMembers = await Member.find({
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
        { guideName: { $regex: search, $options: 'i' } },
        { _id: { $in: teamIdsFromMembers } },
      ];
    }

    const totalTeams = await Team.countDocuments(matchQuery);
    const teams = await Team.find(matchQuery)
      .populate('members')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

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

// @desc    Get single team details with evaluation scores
// @route   GET /api/teams/:id
// @access  Private
const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members');
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    const r1Comp = await Round1CompetitionScore.findOne({ teamId: team._id });
    const r2Comp = await Round2CompetitionScore.findOne({ teamId: team._id });
    const r1Ind = await Round1IndividualScore.find({ teamId: team._id });
    const r2Ind = await Round2IndividualScore.find({ teamId: team._id });

    res.json({
      team,
      round1: {
        competitionScore: r1Comp ? r1Comp.score : null,
        comments: r1Comp ? r1Comp.comments : '',
        individualScores: r1Ind,
      },
      round2: {
        competitionScore: r2Comp ? r2Comp.score : null,
        comments: r2Comp ? r2Comp.comments : '',
        individualScores: r2Ind,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching team details', error: error.message });
  }
};

// @desc    Create a new team with 4 members
// @route   POST /api/teams
// @access  Private
const createTeam = async (req, res) => {
  try {
    const { teamNumber, teamName, department, guideName, members } = req.body;

    // Validation
    if (!teamNumber || !teamName || !department) {
      return res.status(400).json({ message: 'Team number, name, and department are required' });
    }

    if (!members || !Array.isArray(members) || members.length !== 4) {
      return res.status(400).json({ message: 'Each team must have exactly 4 members' });
    }

    // Check duplicate teamNumber
    const existingTeam = await Team.findOne({ teamNumber: teamNumber.trim() });
    if (existingTeam) {
      return res.status(400).json({ message: `Team Number '${teamNumber}' already exists` });
    }

    // Validate members data and check duplicate register numbers
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

    // Check register numbers against DB
    const existingMembers = await Member.find({
      registerNumber: { $in: Array.from(regNumbersInRequest) },
    });
    if (existingMembers.length > 0) {
      const regList = existingMembers.map((m) => m.registerNumber).join(', ');
      return res.status(400).json({
        message: `Register Number(s) already registered in another team: ${regList}`,
      });
    }

    // Create Team container first
    const newTeam = new Team({
      teamNumber: teamNumber.trim(),
      teamName: teamName.trim(),
      department: department.trim(),
      guideName: guideName ? guideName.trim() : '',
    });

    await newTeam.save();

    // Create Members referencing newTeam._id
    const createdMemberIds = [];
    for (const m of members) {
      const memberDoc = await Member.create({
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

    await logActivity(
      'TEAM_CREATED',
      `Team '${newTeam.teamNumber} - ${newTeam.teamName}' created with 4 members`
    );

    const populatedTeam = await Team.findById(newTeam._id).populate('members');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Server error creating team', error: error.message });
  }
};

// @desc    Update team details and members
// @route   PUT /api/teams/:id
// @access  Private
const updateTeam = async (req, res) => {
  try {
    const { teamNumber, teamName, department, guideName, members } = req.body;
    const teamId = req.params.id;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Check teamNumber duplicate if changed
    if (teamNumber && teamNumber.trim() !== team.teamNumber) {
      const dupTeam = await Team.findOne({ teamNumber: teamNumber.trim() });
      if (dupTeam) {
        return res.status(400).json({ message: `Team Number '${teamNumber}' already exists` });
      }
      team.teamNumber = teamNumber.trim();
    }

    if (teamName) team.teamName = teamName.trim();
    if (department) team.department = department.trim();
    if (guideName !== undefined) team.guideName = guideName.trim();

    // If members provided, validate 4 members
    if (members) {
      if (!Array.isArray(members) || members.length !== 4) {
        return res.status(400).json({ message: 'Each team must have exactly 4 members' });
      }

      // Validate register numbers uniqueness excluding current team members
      const currentMemberIds = team.members.map((id) => id.toString());
      for (const m of members) {
        const reg = m.registerNumber.trim().toUpperCase();
        const existing = await Member.findOne({
          registerNumber: reg,
          _id: { $nin: currentMemberIds },
        });
        if (existing) {
          return res.status(400).json({
            message: `Register Number '${reg}' already belongs to another team`,
          });
        }
      }

      // Update existing member docs or recreate
      for (let i = 0; i < members.length; i++) {
        const mData = members[i];
        if (mData._id && currentMemberIds.includes(mData._id)) {
          await Member.findByIdAndUpdate(mData._id, {
            name: mData.name.trim(),
            registerNumber: mData.registerNumber.trim().toUpperCase(),
            department: mData.department.trim(),
            email: mData.email ? mData.email.trim() : '',
            phone: mData.phone ? mData.phone.trim() : '',
          });
        } else {
          // If update by index
          const memberIdToUpdate = team.members[i];
          if (memberIdToUpdate) {
            await Member.findByIdAndUpdate(memberIdToUpdate, {
              name: mData.name.trim(),
              registerNumber: mData.registerNumber.trim().toUpperCase(),
              department: mData.department.trim(),
              email: mData.email ? mData.email.trim() : '',
              phone: mData.phone ? mData.phone.trim() : '',
            });
          }
        }
      }
    }

    await team.save();
    await logActivity('TEAM_UPDATED', `Updated team details for '${team.teamNumber}'`);

    const updatedTeam = await Team.findById(teamId).populate('members');
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
    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Delete members
    await Member.deleteMany({ teamId });
    // Delete scores
    await Round1IndividualScore.deleteMany({ teamId });
    await Round2IndividualScore.deleteMany({ teamId });
    await Round1CompetitionScore.deleteMany({ teamId });
    await Round2CompetitionScore.deleteMany({ teamId });
    // Delete team
    await Team.findByIdAndDelete(teamId);

    await logActivity('TEAM_DELETED', `Deleted team '${team.teamNumber} - ${team.teamName}'`);

    res.json({ message: `Team ${team.teamNumber} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting team', error: error.message });
  }
};

// @desc    Bulk import teams
// @route   POST /api/teams/bulk-import
// @access  Private
const bulkImportTeams = async (req, res) => {
  try {
    const { teams } = req.body;
    if (!teams || !Array.isArray(teams) || teams.length === 0) {
      return res.status(400).json({ message: 'Valid non-empty array of teams is required' });
    }

    let createdCount = 0;
    const errors = [];

    for (let index = 0; index < teams.length; index++) {
      const t = teams[index];
      try {
        if (!t.teamNumber || !t.teamName || !t.department || !t.members || t.members.length !== 4) {
          errors.push(`Row ${index + 1}: Team must have teamNumber, teamName, department, and 4 members.`);
          continue;
        }

        const existingTeam = await Team.findOne({ teamNumber: t.teamNumber.trim() });
        if (existingTeam) {
          errors.push(`Row ${index + 1}: Team Number '${t.teamNumber}' already exists.`);
          continue;
        }

        // Create team
        const newTeam = await Team.create({
          teamNumber: t.teamNumber.trim(),
          teamName: t.teamName.trim(),
          department: t.department.trim(),
          guideName: t.guideName ? t.guideName.trim() : '',
        });

        const memberIds = [];
        for (const m of t.members) {
          const memberDoc = await Member.create({
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

    await logActivity('BULK_IMPORT', `Bulk imported ${createdCount} teams`);
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
