const Message = require('../../models/Message');
const Conversation = require('../../models/Conversation');
const Notification = require('../../models/Notification');
const { assertParticipant } = require('../../services/conversationService');
const { createMessage } = require('../../services/messageService');

const roomName = (conversationId) => `conversation:${conversationId}`;
const userRoom = (userId) => `user:${userId}`;

function registerMessageHandlers(io, socket) {
  const userId = String(socket.user._id);

  // Every authenticated user joins their own personal room on connect —
  // this is how we push notifications/presence to them regardless of
  // which conversation (if any) they currently have open.
  socket.join(userRoom(userId));

  // --- Room management ---
  socket.on('join_conversation', async (conversationId) => {
    try {
      await assertParticipant(conversationId, userId);
      socket.join(roomName(conversationId));
    } catch (err) {
      socket.emit('socket_error', { message: err.message });
    }
  });

  socket.on('leave_conversation', (conversationId) => {
    socket.leave(roomName(conversationId));
  });

  // --- Sending a message ---
  socket.on('send_message', async (payload, ack) => {
    try {
      const { conversationId, text, replyTo, attachments, messageType } = payload;

      const message = await createMessage({
        conversationId,
        senderId: userId,
        text,
        replyTo,
        attachments,
        messageType,
      });

      // Broadcast to everyone currently in the conversation room (includes sender's other tabs).
      io.to(roomName(conversationId)).emit('receive_message', { message });

      // Notify every other participant's personal room, so their sidebar/badge
      // updates live even if they don't currently have this conversation open.
      const conversation = await Conversation.findById(conversationId).select('participants');
      const others = conversation.participants.filter((p) => String(p) !== userId);

      for (const recipientId of others) {
        const notification = await Notification.create({
          recipient: recipientId,
          sender: userId,
          type: conversation.isGroup ? 'group_message' : 'message',
          conversation: conversationId,
          message: message._id,
        });
        io.to(userRoom(recipientId)).emit('new_notification', { notification });
      }

      // Acknowledge back to the sender's own client (used to replace an
      // optimistic "sending..." bubble with the real, persisted message).
      if (typeof ack === 'function') ack({ success: true, message });
    } catch (err) {
      if (typeof ack === 'function') ack({ success: false, message: err.message });
      socket.emit('socket_error', { message: err.message });
    }
  });

  // --- Typing indicator (never persisted — purely ephemeral) ---
  socket.on('typing_start', ({ conversationId }) => {
    socket.to(roomName(conversationId)).emit('typing_start', { conversationId, userId });
  });

  socket.on('typing_stop', ({ conversationId }) => {
    socket.to(roomName(conversationId)).emit('typing_stop', { conversationId, userId });
  });

  // --- Delivered receipt: recipient's client fires this once the message
  // has actually arrived on their device (app foregrounded, socket connected). ---
  socket.on('message_delivered', async ({ messageId, conversationId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { deliveredTo: userId } });
      io.to(roomName(conversationId)).emit('message_delivered', { messageId, userId });
    } catch (err) {
      socket.emit('socket_error', { message: err.message });
    }
  });

  // --- Read receipt: fired when the recipient actually opens the conversation. ---
  socket.on('message_read', async ({ messageId, conversationId }) => {
    try {
      await Message.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } });
      io.to(roomName(conversationId)).emit('message_read', { messageId, userId });
    } catch (err) {
      socket.emit('socket_error', { message: err.message });
    }
  });
}

module.exports = { registerMessageHandlers };
