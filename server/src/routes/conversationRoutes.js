const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getConversations,
  createConversation,
  getConversationById,
} = require('../controllers/conversationController');

const router = express.Router();

router.use(protect); // every conversation route requires authentication

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversationById);

module.exports = router;
