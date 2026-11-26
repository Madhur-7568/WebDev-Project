const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { syncTableToCsv } = require('../db/csvSync');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_college_lab_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// @desc    Register a new user in PostgreSQL
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

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const id = `usr_${Date.now()}`;
    const validRoles = ['superadmin', 'organizer', 'venue_manager', 'staff', 'attendee', 'student', 'admin'];
    const assignedRole = role && validRoles.includes(role) ? role : 'attendee';
    const assignedCollegeId = collegeId || `ID_${Math.floor(1000 + Math.random() * 9000)}`;
    const assignedDept = department || 'General';

    const insertRes = await query(
      `INSERT INTO users (id, name, email, password_hash, role, college_id, department)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, name, email, role, college_id AS "collegeId", department, created_at AS "createdAt"`,
      [id, name.trim(), normalizedEmail, passwordHash, assignedRole, assignedCollegeId, assignedDept]
    );

    const safeUser = insertRes.rows[0];
    const token = generateToken(safeUser.id);
    await syncTableToCsv('users', query);

    res.status(201).json({
      success: true,
      message: 'Account created and saved in PostgreSQL!',
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

    const normalizedEmail = email.toLowerCase().trim();
    const result = await query(
      `SELECT id, name, email, password_hash, role, college_id AS "collegeId", department, created_at AS "createdAt"
       FROM users WHERE email = $1`,
      [normalizedEmail]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.'
      });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const token = generateToken(user.id);
    const { password_hash: _, ...safeUser } = user;

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
