const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    isGroup: {
      type: Boolean,
      default: false,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // Group-only fields (ignored for 1:1 conversations)
    groupName: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    groupAvatar: {
      type: String,
      default: '',
    },
    groupAdmins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    // Denormalized so the sidebar can render without a join/populate on every message.
    lastMessage: {
      text: { type: String, default: '' },
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      messageType: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

// Speeds up "find all conversations for user X" (every sidebar load).
conversationSchema.index({ participants: 1 });
// Speeds up "does a 1:1 conversation between A and B already exist".
conversationSchema.index({ isGroup: 1, participants: 1 });

module.exports = mongoose.model('Conversation', conversationSchema);
