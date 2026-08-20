const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken, setTokenCookie } = require('../utils/token');
const User = require('../models/User');

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    const field = existing.username === username ? 'Username' : 'Email';
    throw new ApiError(409, `${field} is already taken`);
  }

  const user = await User.create({ name, username, email, password });

  const token = signToken(user._id);
  setTokenCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: { user, token },
  });
});

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body; // identifier = username or email

  const user = await User.findOne({
    $or: [{ username: identifier?.toLowerCase() }, { email: identifier?.toLowerCase() }],
  }).select('+password');

  // Deliberately vague message on both "no such user" and "wrong password" —
  // being specific here lets an attacker enumerate valid usernames/emails.
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid credentials');
  }

  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();

  const token = signToken(user._id);
  setTokenCookie(res, token);

  res.status(200).json({
    success: true,
    message: 'Logged in successfully',
    data: { user, token },
  });
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  if (req.user) {
    req.user.isOnline = false;
    req.user.lastSeen = new Date();
    await req.user.save();
  }
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, data: { user: req.user } });
});

module.exports = { register, login, logout, getMe };
