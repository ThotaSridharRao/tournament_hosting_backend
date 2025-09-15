// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateRegister, validateLogin } = require('../middlewares/validation.middleware');
const { authLimiter, loginLimiter, registerLimiter } = require('../middlewares/rateLimiter.middleware');

// Public routes with rate limiting
router.post('/register', registerLimiter, validateRegister, authCtrl.register);
router.post('/login', loginLimiter, validateLogin, authCtrl.login);
router.post('/check-email', authLimiter, authCtrl.checkEmail);
router.post('/check-username', authLimiter, authCtrl.checkUsername);

// Protected routes (require authentication)
router.get('/me', authMiddleware, authCtrl.me);
router.post('/logout', authMiddleware, authCtrl.logout);
router.post('/refresh', authMiddleware, authCtrl.refreshToken);

module.exports = router;
