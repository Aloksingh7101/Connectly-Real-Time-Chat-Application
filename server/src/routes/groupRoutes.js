const express = require('express');
const { protect } = require('../middleware/auth');
const {
  createGroup,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
} = require('../controllers/groupController');

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.put('/:id', updateGroup);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveGroup);

module.exports = router;
