const jwt = require('jsonwebtoken');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { jwtSecret } = require('../config/env');
const User = require('../models/User');

// Protects a route: verifies the JWT (from the httpOnly cookie, or a
// Bearer header as a fallback for non-browser clients) and attaches the
// authenticated user to req.user so downstream controllers can trust it.
const protect = asyncHandler(async (req, res, next) => {
  let token = req.cookies?.token;

  if (!token && req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authenticated. Please log in.');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, jwtSecret);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired session. Please log in again.');
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new ApiError(401, 'User no longer exists.');
  }

  req.user = user; // downstream controllers use req.user._id, never trust req.body.userId
  next();
});

module.exports = { protect };
