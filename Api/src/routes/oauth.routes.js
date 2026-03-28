const { Router } = require('express');
const passport = require('../config/passport');
const { generateToken } = require('../utils/token');
const { CORS_ORIGIN, GOOGLE_CLIENT_ID } = require('../config/env');

const router = Router();

// Only register Google routes if credentials are configured
if (GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.startsWith('placeholder')) {
  router.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  router.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: `${CORS_ORIGIN}/login` }),
    (req, res) => {
      const token = generateToken(req.user);
      res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
      res.redirect(`${CORS_ORIGIN}/joblist`);
    }
  );
} else {
  // Return a helpful error if Google OAuth is not configured
  router.get('/auth/google', (req, res) => {
    res.status(501).json({ message: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env' });
  });
}

module.exports = router;
