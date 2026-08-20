const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getMessages,
  postMessage,
  editMessage,
  deleteMessage,
} = require('../controllers/messageController');

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', postMessage);
router.put('/:id', editMessage);
router.delete('/:id', deleteMessage);

module.exports = router;
