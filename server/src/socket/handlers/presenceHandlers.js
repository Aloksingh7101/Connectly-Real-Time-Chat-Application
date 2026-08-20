const User = require('../../models/User');

// A user might have multiple sockets open (two browser tabs, phone + laptop).
// We only want to broadcast "user_offline" once ALL of their sockets have
// disconnected — this in-memory map tracks how many open sockets each user
// currently has. It resets on server restart, which is fine: on restart
// every client reconnects anyway and repopulates it within seconds.
const onlineCounts = new Map();

function registerPresenceHandlers(io, socket) {
  const userId = String(socket.user._id);

  markOnline(io, socket, userId);

  socket.on('disconnect', async () => {
    const remaining = (onlineCounts.get(userId) || 1) - 1;
    if (remaining <= 0) {
      onlineCounts.delete(userId);
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
      io.emit('user_offline', { userId, lastSeen: new Date() });
    } else {
      onlineCounts.set(userId, remaining);
    }
  });
}

async function markOnline(io, socket, userId) {
  const count = (onlineCounts.get(userId) || 0) + 1;
  onlineCounts.set(userId, count);

  if (count === 1) {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    // Broadcasting to everyone is simple and fine at this scale; at real
    // scale we'd only notify users who share a conversation with this user.
    io.emit('user_online', { userId });
  }
}

module.exports = { registerPresenceHandlers };
