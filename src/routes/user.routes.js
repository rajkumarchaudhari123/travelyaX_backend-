'use strict';

const router = require('express').Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../config/multer');

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/profile',             userController.getProfile);
router.put('/profile',             userController.updateProfile);
router.post('/avatar',             uploadSingle('avatar'), userController.updateAvatar);
router.delete('/account',          userController.deactivateAccount);

// Driver-only
router.patch(
  '/driver/online-status',
  authorize('driver'),
  userController.toggleOnlineStatus
);

// Admin-only
router.get(
  '/admin/users',
  authorize('admin'),
  userController.listUsers
);
router.patch(
  '/admin/drivers/:driverId/review',
  authorize('admin'),
  userController.reviewDriverApplication
);

module.exports = router;
