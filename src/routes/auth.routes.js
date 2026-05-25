'use strict';

const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { authLimiter } = require('../middlewares/rateLimiter.middleware');

// Public routes — rate limited
router.post('/register-rider',  authLimiter, authController.registerRider);
router.post('/register-driver', authLimiter, authController.registerDriver);
router.post('/login',           authLimiter, authController.login);
router.post('/refresh-token',   authLimiter, authController.refreshToken);

// Protected routes
router.use(authenticate);
router.post('/logout',          authController.logout);
router.post('/change-password', authController.changePassword);
router.get('/me',               authController.getMe);

module.exports = router;
