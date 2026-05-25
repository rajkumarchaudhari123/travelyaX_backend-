'use strict';

const router = require('express').Router();
const notificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/',                    notificationController.getNotifications);
router.get('/unread-count',        notificationController.getUnreadCount);
router.patch('/mark-all-read',     notificationController.markAllAsRead);
router.delete('/clear-read',       notificationController.clearReadNotifications);
router.patch('/:id/read',          notificationController.markAsRead);
router.delete('/:id',              notificationController.deleteNotification);

module.exports = router;
