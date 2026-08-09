const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const { logActivity } = require('../utils/activityLogger');
const { initializeUserWorkspace } = require('../utils/userWorkspace');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'hems_secret_key_2026', {
    expiresIn: '7d',
  });
};

// @desc    Register a new organizer account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database is currently disconnected. Please check your MongoDB connection.',
      });
    }

    const { username, password, name, organization } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ message: 'Please provide full name, username, and password' });
    }

    const cleanUsername = username.toLowerCase().trim();
    if (cleanUsername.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ username: cleanUsername });
    if (userExists) {
      return res.status(400).json({ message: 'Username already taken. Please choose another one.' });
    }

    const user = await User.create({
      username: cleanUsername,
      password,
      name: name.trim(),
      organization: organization ? organization.trim() : '',
      role: 'organizer',
    });

    // Initialize isolated default workspace (settings + default rounds)
    await initializeUserWorkspace(user._id);

    await logActivity('USER_REGISTER', `New organizer registered: ${user.username}`);

    return res.status(201).json({
      _id: user._id,
      username: user.username,
      name: user.name,
      organization: user.organization,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error details:', error);
    res.status(500).json({ message: `Registration failed: ${error.message}`, error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        message: 'Database is currently disconnected. Please check your MongoDB connection.',
      });
    }

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    const user = await User.findOne({ username: username.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      await logActivity('USER_LOGIN', `User ${user.username} logged in successfully`);

      // Ensure their workspace settings/rounds exist if not already created
      await initializeUserWorkspace(user._id);

      return res.json({
        _id: user._id,
        username: user.username,
        name: user.name,
        organization: user.organization || '',
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error details:', error);
    res.status(500).json({ message: `Login failed: ${error.message}`, error: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error getting profile', error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    if (req.user) {
      await logActivity('USER_LOGOUT', `User ${req.user.username} logged out`);
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout error', error: error.message });
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
