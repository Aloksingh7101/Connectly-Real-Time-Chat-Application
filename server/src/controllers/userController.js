const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

// GET /api/users/search?q=
const searchUsers = asyncHandler(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) {
    return res.status(200).json({ success: true, data: { users: [] } });
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user._id } }, // never return yourself in search results
      {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { name: { $regex: q, $options: 'i' } },
        ],
      },
    ],
  })
    .select('name username avatar bio isOnline lastSeen')
    .limit(20);

  res.status(200).json({ success: true, data: { users } });
});

// GET /api/users/:id
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) throw new ApiError(404, 'User not found');
  res.status(200).json({ success: true, data: { user } });
});

// PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, bio, avatar } = req.body;

  if (name !== undefined) req.user.name = name;
  if (bio !== undefined) req.user.bio = bio;
  if (avatar !== undefined) req.user.avatar = avatar;

  await req.user.save();
  res.status(200).json({ success: true, data: { user: req.user } });
});

// PUT /api/users/password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'currentPassword and newPassword are required');
  }
  if (newPassword.length < 6) {
    throw new ApiError(400, 'New password must be at least 6 characters');
  }

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword; // pre-save hook re-hashes it
  await user.save();

  res.status(200).json({ success: true, message: 'Password updated successfully' });
});

module.exports = { searchUsers, getUserById, updateProfile, changePassword };
