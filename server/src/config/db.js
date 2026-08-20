const mongoose = require('mongoose');
const { mongoUri } = require('./env');

async function connectDB() {
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('[db] MongoDB connection failed:', err.message);
    // Exit the process — the app is useless without a DB connection,
    // and letting it limp along would just produce confusing 500s later.
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] MongoDB disconnected');
  });
}

module.exports = connectDB;
