const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn, nodeEnv } = require('../config/env');

function signToken(userId) {
  return jwt.sign({ id: userId }, jwtSecret, { expiresIn: jwtExpiresIn });
}

// Sends the JWT as an httpOnly cookie. httpOnly means client-side JS can't
// read it, which meaningfully reduces XSS token-theft risk compared to
// storing the token in localStorage.
function setTokenCookie(res, token) {
  const isProd = nodeEnv === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd, // only sent over HTTPS in production
    sameSite: isProd ? 'none' : 'lax', // 'none' needed for cross-site Vercel<->Render in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

module.exports = { signToken, setTokenCookie };
