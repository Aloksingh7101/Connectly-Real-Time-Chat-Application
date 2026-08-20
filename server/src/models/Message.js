const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 4000,
    },
    attachments: [
      {
        url: { type: String, required: true },
        publicId: { type: String }, // Cloudinary asset id, needed to delete later
        type: { type: String, enum: ['image', 'file'], required: true },
        name: { type: String },
        size: { type: Number },
      },
    ],
    messageType: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      forEveryone: { type: Boolean, default: false },
      deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
    deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// The single most important index in the schema: powers "load the last
// N messages of this conversation, sorted newest-first" for pagination.
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
