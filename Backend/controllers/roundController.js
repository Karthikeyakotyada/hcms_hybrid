const Round = require('../models/Round');
const EvaluationScore = require('../models/EvaluationScore');

// @desc    Get all evaluation rounds
// @route   GET /api/rounds
// @access  Private
const getRounds = async (req, res) => {
  try {
    const userId = req.user._id;
    const rounds = await Round.find({ user: userId }).sort({ order: 1, createdAt: 1 });
    res.json(rounds);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching evaluation rounds', error: error.message });
  }
};

// @desc    Create a new evaluation round
// @route   POST /api/rounds
// @access  Private
const createRound = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, weight, order } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Round name is required' });
    }

    const existingCount = await Round.countDocuments({ user: userId });
    const round = await Round.create({
      user: userId,
      name: name.trim(),
      description: description ? description.trim() : '',
      weight: Number(weight) || 1,
      order: order !== undefined ? Number(order) : existingCount + 1,
      isActive: true,
      isLocked: false,
    });

    res.status(201).json(round);
  } catch (error) {
    res.status(500).json({ message: 'Error creating evaluation round', error: error.message });
  }
};

// @desc    Update an evaluation round
// @route   PUT /api/rounds/:id
// @access  Private
const updateRound = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, description, weight, order, isActive, isLocked } = req.body;
    const round = await Round.findOne({ _id: req.params.id, user: userId });

    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found' });
    }

    if (name) round.name = name.trim();
    if (description !== undefined) round.description = description.trim();
    if (weight !== undefined) round.weight = Number(weight);
    if (order !== undefined) round.order = Number(order);
    if (typeof isActive === 'boolean') round.isActive = isActive;
    if (typeof isLocked === 'boolean') round.isLocked = isLocked;

    await round.save();
    res.json(round);
  } catch (error) {
    res.status(500).json({ message: 'Error updating evaluation round', error: error.message });
  }
};

// @desc    Delete an evaluation round and associated scores
// @route   DELETE /api/rounds/:id
// @access  Private
const deleteRound = async (req, res) => {
  try {
    const userId = req.user._id;
    const round = await Round.findOne({ _id: req.params.id, user: userId });
    if (!round) {
      return res.status(404).json({ message: 'Evaluation round not found' });
    }

    // Remove associated scores for this round and user
    await EvaluationScore.deleteMany({ roundId: round._id, user: userId });

    await round.deleteOne();
    res.json({ message: 'Round and associated scores deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting evaluation round', error: error.message });
  }
};

module.exports = {
  getRounds,
  createRound,
  updateRound,
  deleteRound,
};
