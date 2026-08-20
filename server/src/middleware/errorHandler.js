const { nodeEnv } = require('../config/env');

// Catches 404s for any route that didn't match — must be registered
// after all real routes, before the error handler.
function notFound(req, res, next) {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
}

// Centralized error handler — every thrown/forwarded error in the app
// ends up here. This is what stops raw stack traces or Mongo error
// internals from leaking to the client.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode < 400) statusCode = 500;

  let message = err.message || 'Internal server error';

  // Mongoose validation errors -> 400 with readable field messages
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose duplicate key error (unique index violation, e.g. username taken)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already in use`;
  }

  // Malformed ObjectId in a param (e.g. /api/users/not-a-valid-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    // Never leak stack traces outside development.
    stack: nodeEnv === 'development' ? err.stack : undefined,
  });
}

module.exports = { notFound, errorHandler };
