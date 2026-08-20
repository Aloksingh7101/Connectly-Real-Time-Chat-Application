const jwt = require('jsonwebtoken');
const cookie = require('cookie');
const { jwtSecret } = require('../config/env');
const User = require('../models/User');

// Runs once per socket connection attempt, before 'connection' fires.
// An unauthenticated socket never gets a chance to join a room or emit
// anything — this is the socket-layer equivalent of the `protect` REST middleware.
async function socketAuth(socket, next) {
  try {
    let token = socket.handshake.auth?.token;

    // Fallback: parse the httpOnly cookie sent by the browser during the
    // socket handshake (works because Socket.IO's handshake is still an HTTP request).
    if (!token && socket.handshake.headers.cookie) {
      const parsed = cookie.parse(socket.handshake.headers.cookie);
      token = parsed.token;
    }

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new Error('User no longer exists'));
    }

    socket.user = user; // available to every handler as socket.user
    next();
  } catch (err) {
    next(new Error('Invalid or expired session'));
  }
}

module.exports = socketAuth;
