const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dataStore = require('../models/dataStore');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_college_lab_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, collegeId, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    // Check if email already registered
    const existing = dataStore.findUserByEmail(email);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    // Password strength check
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = dataStore.createUser({
      name,
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role && ['student', 'organizer', 'admin'].includes(role) ? role : 'student',
      collegeId: collegeId || `ID_${Math.floor(1000 + Math.random() * 9000)}`,
      department: department || 'General'
    });

    const token = generateToken(newUser.id);
    const { passwordHash: _, ...safeUser } = newUser;

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get JWT token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an email and password.'
      });
    }

    const user = dataStore.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user.id);
    const { passwordHash: _, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Logged in successfully!',
      token,
      user: safeUser
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  getMe
};
