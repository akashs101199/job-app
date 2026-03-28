const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// Generate short-lived access token (1 hour)
const generateAccessToken = (user) => {
  return jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
};

// Generate long-lived refresh token (7 days)
const generateRefreshToken = (user) => {
  return jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '7d' });
};

// Verify any token (access or refresh)
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

// For backwards compatibility
const generateToken = (user) => {
  return generateAccessToken(user);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateToken,
  verifyToken
};
