// A predictable error shape lets the centralized error middleware (Phase 7)
// decide the HTTP status code and message without guessing, and lets us
// distinguish "expected" errors (bad password, not found) from real bugs.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // marks this as an expected, handled error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
