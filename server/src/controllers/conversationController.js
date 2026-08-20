const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Conversation = require('../models/Conversation');
const { findOrCreatePrivateConversation, assertParticipant } = require('../services/conversationService');

// GET /api/conversations — list all conversations for the logged-in user,
// most recently active first. This is the sidebar's data source.
const getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id })
    .populate('participants', '-password')
    .populate('lastMessage.sender', 'name username avatar')
    .sort({ updatedAt: -1 });

  res.status(200).json({ success: true, data: { conversations } });
});

// POST /api/conversations — find-or-create a 1:1 conversation with another user.
// Group creation has its own endpoint (POST /api/groups, added in Phase 6).
const createConversation = asyncHandler(async (req, res) => {
  const { participantId } = req.body;
  if (!participantId) {
    throw new ApiError(400, 'participantId is required');
  }

  const conversation = await findOrCreatePrivateConversation(req.user._id, participantId);
  res.status(200).json({ success: true, data: { conversation } });
});

// GET /api/conversations/:id
const getConversationById = asyncHandler(async (req, res) => {
  await assertParticipant(req.params.id, req.user._id);

  const conversation = await Conversation.findById(req.params.id)
    .populate('participants', '-password')
    .populate('groupAdmins', 'name username avatar');

  res.status(200).json({ success: true, data: { conversation } });
});

module.exports = { getConversations, createConversation, getConversationById };
