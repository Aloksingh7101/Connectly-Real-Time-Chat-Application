const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./socket');
const { port } = require('./config/env');

const server = http.createServer(app);

// Socket.IO attaches to this same HTTP server — one process serves both
// REST and WebSocket traffic, so there's a single entry point that owns
// both layers instead of two separate "app starts" to reason about.
initSocket(server);

async function start() {
  await connectDB();
  server.listen(port, () => {
    console.log(`[server] Connectly API running on port ${port}`);
  });
}

start();

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
  server.close(() => process.exit(1));
});

module.exports = server;
