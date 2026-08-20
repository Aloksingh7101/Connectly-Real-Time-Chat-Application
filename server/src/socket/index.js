const { Server } = require('socket.io');
const { clientUrl } = require('../config/env');
const socketAuth = require('./socketAuth');
const { registerMessageHandlers } = require('./handlers/messageHandlers');
const { registerPresenceHandlers } = require('./handlers/presenceHandlers');

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`[socket] connected: ${socket.user.username} (${socket.id})`);

    registerPresenceHandlers(io, socket);
    registerMessageHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`[socket] disconnected: ${socket.user.username} (${reason})`);
    });
  });

  return io;
}

module.exports = initSocket;
