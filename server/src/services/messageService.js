const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { assertParticipant } = require('./conversationService');

// Creates a message, then updates the parent conversation's denormalized
// lastMessage field. Both REST (POST /api/messages) and the socket
// send_message handler call this exact function, so there is exactly one
// code path that can create a message — no risk of the two drifting apart.
async function createMessage({ conversationId, senderId, text, replyTo, attachments, messageType }) {
  await assertParticipant(conversationId, senderId);

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    text,
    replyTo: replyTo || null,
    attachments: attachments || [],
    messageType: messageType || 'text',
    deliveredTo: [senderId], // sender has implicitly "received" their own message
    readBy: [senderId],
  });

  await Conversation.findByIdAndUpdate(conversationId, {
    lastMessage: {
      text: message.text,
      sender: message.sender,
      messageType: message.messageType,
      timestamp: message.createdAt,
    },
  });

  return message.populate([
    { path: 'sender', select: '-password' },
    { path: 'replyTo' },
  ]);
}

module.exports = { createMessage };
