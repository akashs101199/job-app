const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const requireAuth = require('../middleware/requireAuth');
const { loginLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validate');

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, loginLimiter, authController.login);
router.post('/logout', authController.logout);
router.get('/me', requireAuth, authController.me);

module.exports = router;
