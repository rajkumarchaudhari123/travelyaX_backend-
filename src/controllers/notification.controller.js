'use strict';

const notificationService = require('../services/notification.service');
const { sendSuccess, sendPaginated, parsePagination } = require('../utils/response');
const { AppError } = require('../utils/AppError');

class NotificationController {
  /**
   * GET /api/notifications
   */
  async getNotifications(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { type, isRead } = req.query;

      const { rows, count, unreadCount } = await notificationService.getNotifications(
        req.userId,
        {
          page,
          limit,
          type,
          isRead: isRead !== undefined ? isRead === 'true' : undefined,
        }
      );

      return res.status(200).json({
        success: true,
        message: 'Notifications retrieved successfully',
        data:    rows,
        meta: {
          total:       count,
          page,
          limit,
          totalPages:  Math.ceil(count / limit),
          unreadCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/notifications/unread-count
   */
  async getUnreadCount(req, res, next) {
    try {
      const result = await notificationService.getUnreadCount(req.userId);
      return sendSuccess(res, result, 'Unread count retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/:id/read
   */
  async markAsRead(req, res, next) {
    try {
      const notifId = parseInt(req.params.id, 10);
      if (!notifId) return next(AppError.badRequest('Invalid notification ID'));

      const notification = await notificationService.markAsRead(req.userId, notifId);
      return sendSuccess(res, notification, 'Notification marked as read');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/notifications/mark-all-read
   */
  async markAllAsRead(req, res, next) {
    try {
      const result = await notificationService.markAllAsRead(req.userId);
      return sendSuccess(res, result, `${result.updatedCount} notification(s) marked as read`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notifications/:id
   */
  async deleteNotification(req, res, next) {
    try {
      const notifId = parseInt(req.params.id, 10);
      if (!notifId) return next(AppError.badRequest('Invalid notification ID'));

      await notificationService.deleteNotification(req.userId, notifId);
      return sendSuccess(res, null, 'Notification deleted');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/notifications/clear-read
   */
  async clearReadNotifications(req, res, next) {
    try {
      const result = await notificationService.clearReadNotifications(req.userId);
      return sendSuccess(res, result, `${result.deletedCount} read notification(s) cleared`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new NotificationController();
