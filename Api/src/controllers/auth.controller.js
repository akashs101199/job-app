const { generateToken } = require('../utils/token');
const authService = require('../services/auth.service');

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

    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 3600000 });
    return res.status(200).json({
      message: 'Login successful',
      user: { email: user.email, firstName: user.firstName },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error during login' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token');
  return res.status(200).json({ message: 'Logged out successfully' });
};

const me = async (req, res) => {
  try {
    const user = await authService.findUserProfile(req.user.email);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching user data' });
  }
};

module.exports = { register, login, logout, me };
