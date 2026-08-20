const rateLimit = require('express-rate-limit');

// Generous general API limit — mainly a backstop against runaway clients/bots.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// Much stricter limit on auth endpoints specifically — this is the one
// that actually matters for security, since it's what stops a brute-force
// password-guessing script from hammering /api/auth/login.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' },
});

module.exports = { apiLimiter, authLimiter };
