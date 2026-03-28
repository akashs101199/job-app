const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const authService = require('../services/auth.service');

// Security note: Error messages are generic to prevent information leakage
// (e.g., "Invalid email or password" instead of "User not found" or "Password incorrect")
// This prevents attackers from enumerating valid email addresses.

const register = async (req, res) => {
  const { email, password, firstName, lastName, dob } = req.body;

  try {
    const existing = await authService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email is already registered. Please use a different email.' });
    }

    const newUser = await authService.createUser({ email, password, firstName, lastName, dob });
    return res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error creating user.' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authService.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const valid = await authService.comparePassword(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Transparently migrate plaintext password to bcrypt
    await authService.migratePasswordIfNeeded(email, password, user.password);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await authService.updateRefreshToken(email, refreshToken);

    // Set access token as httpOnly cookie (1 hour)
    res.cookie('token', accessToken, { httpOnly: true, secure: false, maxAge: 3600000 });
    // Set refresh token as httpOnly cookie (7 days)
    res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: false, maxAge: 604800000 });

    return res.status(200).json({
      message: 'Login successful',
      user: { email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

const logout = (_req, res) => {
  res.clearCookie('token');
  res.clearCookie('refreshToken');
  return res.status(200).json({ message: 'Logged out successfully' });
};

const refresh = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token missing' });
  }

  try {
    // Verify refresh token
    const decoded = require('../utils/token').verifyToken(refreshToken);
    const user = await authService.findUserByEmail(decoded.email);

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);
    res.cookie('token', newAccessToken, { httpOnly: true, secure: false, maxAge: 3600000 });

    return res.status(200).json({
      message: 'Token refreshed',
      user: { email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(403).json({ message: 'Invalid refresh token' });
  }
};

const me = async (req, res) => {
  try {
    const user = await authService.findUserProfile(req.user.email);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
};

module.exports = { register, login, logout, refresh, me };
