const express = require('express');
const { protect } = require('../middleware/auth');
const {
  searchUsers,
  getUserById,
  updateProfile,
  changePassword,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

// /search must be registered before /:id, otherwise Express would treat
// "search" as an :id value and pass it to getUserById by mistake.
router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.put('/password', changePassword);
router.get('/:id', getUserById);

module.exports = router;
