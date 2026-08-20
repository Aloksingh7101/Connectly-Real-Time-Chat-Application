const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Message = require('../models/Message');
const { assertParticipant } = require('../services/conversationService');
const { createMessage } = require('../services/messageService');

// GET /api/messages/:conversationId?page=1&limit=30
// Cursor-free offset pagination is fine at this scale; the important part
// is that we NEVER load an entire conversation's history at once — that's
// the #1 real-world performance bug in chat apps with long-lived conversations.
const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
  const skip = (page - 1) * limit;

  await assertParticipant(conversationId, req.user._id);

  // Newest first for the query (uses the {conversation, createdAt} index),
  // then reversed so the client can render top-to-bottom naturally.
  const messages = await Message.find({
    conversation: conversationId,
    'deleted.deletedFor': { $ne: req.user._id },
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('sender', 'name username avatar')
    .populate('replyTo');

  res.status(200).json({
    success: true,
    data: {
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit,
    },
  });
});

// POST /api/messages — REST fallback for creating a message. In practice
// the frontend uses the socket 'send_message' event for the real-time
// hot path, but this exists for non-socket clients, testing, and as the
// same underlying code path (see messageService.createMessage).
const postMessage = asyncHandler(async (req, res) => {
  const { conversationId, text, replyTo } = req.body;
  if (!conversationId || !text) {
    throw new ApiError(400, 'conversationId and text are required');
  }

  const message = await createMessage({
    conversationId,
    senderId: req.user._id,
    text,
    replyTo,
  });

  res.status(201).json({ success: true, data: { message } });
});

// PUT /api/messages/:id — edit a message. Only the original sender may edit.
const editMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) {
    throw new ApiError(400, 'text is required');
  }

  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');

  if (String(message.sender) !== String(req.user._id)) {
    throw new ApiError(403, 'You can only edit your own messages');
  }
  if (message.deleted.forEveryone) {
    throw new ApiError(400, 'Cannot edit a deleted message');
  }

  message.text = text;
  message.edited = true;
  await message.save();

  res.status(200).json({ success: true, data: { message } });
});

// DELETE /api/messages/:id?mode=me|everyone
const deleteMessage = asyncHandler(async (req, res) => {
  const mode = req.query.mode === 'everyone' ? 'everyone' : 'me';

  const message = await Message.findById(req.params.id);
  if (!message) throw new ApiError(404, 'Message not found');

  if (mode === 'everyone') {
    // Only the original sender can delete for everyone — this prevents
    // a recipient from erasing evidence of a message they didn't send.
    if (String(message.sender) !== String(req.user._id)) {
      throw new ApiError(403, 'Only the sender can delete this message for everyone');
    }
    message.deleted.forEveryone = true;
    message.text = '';
    message.attachments = [];
  } else {
    // "Delete for me" just hides it from this user's own view.
    if (!message.deleted.deletedFor.includes(req.user._id)) {
      message.deleted.deletedFor.push(req.user._id);
    }
  }

  await message.save();
  res.status(200).json({ success: true, data: { message } });
});

module.exports = { getMessages, postMessage, editMessage, deleteMessage };
