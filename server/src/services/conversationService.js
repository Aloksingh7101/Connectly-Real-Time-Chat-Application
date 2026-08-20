const Conversation = require('../models/Conversation');
const ApiError = require('../utils/ApiError');

// Finds an existing 1:1 conversation between two users, or creates one.
// Centralized here so we never end up with duplicate private conversations
// between the same pair of users (a common bug if this logic lived in
// two places — REST controller AND socket handler — and drifted apart).
async function findOrCreatePrivateConversation(userIdA, userIdB) {
  if (String(userIdA) === String(userIdB)) {
    throw new ApiError(400, 'Cannot start a conversation with yourself');
  }

  let conversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [userIdA, userIdB], $size: 2 },
  }).populate('participants', '-password');

  if (!conversation) {
    conversation = await Conversation.create({
      isGroup: false,
      participants: [userIdA, userIdB],
    });
    conversation = await conversation.populate('participants', '-password');
  }

  return conversation;
}

// Throws if the user is not a participant of the conversation — used by
// every message/conversation operation to enforce authorization.
async function assertParticipant(conversationId, userId) {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new ApiError(404, 'Conversation not found');
  }
  const isParticipant = conversation.participants.some(
    (p) => String(p) === String(userId)
  );
  if (!isParticipant) {
    throw new ApiError(403, 'You are not a participant of this conversation');
  }
  return conversation;
}

module.exports = { findOrCreatePrivateConversation, assertParticipant };
