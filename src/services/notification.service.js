'use strict';

const { Notification } = require('../models');
const { AppError } = require('../utils/AppError');
const { Op } = require('sequelize');

class NotificationService {
  /**
   * Get paginated notifications for a user
   */
  async getNotifications(userId, { page = 1, limit = 20, type, isRead } = {}) {
    const offset = (page - 1) * limit;
    const where  = { userId };

    if (type !== undefined)   where.type   = type;
    if (isRead !== undefined) where.isRead = isRead;

    // Filter out expired notifications
    where[Op.or] = [
      { expiresAt: null },
      { expiresAt: { [Op.gt]: new Date() } },
    ];

    const { rows, count } = await Notification.findAndCountAll({
      where,
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit, 10),
      offset,
    });

    const unreadCount = await Notification.count({
      where: { userId, isRead: false },
    });

    return { rows, count, unreadCount };
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId, notificationId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw AppError.notFound('Notification');
    if (notification.isRead) return notification;

    await notification.update({ isRead: true, readAt: new Date() });
    return notification;
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    const [updatedCount] = await Notification.update(
      { isRead: true, readAt: new Date() },
      { where: { userId, isRead: false } }
    );
    return { updatedCount };
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(userId, notificationId) {
    const notification = await Notification.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) throw AppError.notFound('Notification');
    await notification.destroy();
    return { deleted: true };
  }

  /**
   * Delete all read notifications for a user
   */
  async clearReadNotifications(userId) {
    const deletedCount = await Notification.destroy({
      where: { userId, isRead: true },
    });
    return { deletedCount };
  }

  /**
   * Create a notification (internal use)
   */
  async createNotification({ userId, title, message, type = 'system', referenceId = null, referenceType = null, data = null }) {
    return Notification.create({
      userId, title, message, type,
      referenceId, referenceType, data,
    });
  }

  /**
   * Broadcast notification to multiple users
   */
  async broadcastNotification(userIds, { title, message, type = 'system', data = null }) {
    if (!userIds || userIds.length === 0) return { sent: 0 };

    const records = userIds.map((userId) => ({
      userId, title, message, type, data,
    }));

    await Notification.bulkCreate(records);
    return { sent: records.length };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    const count = await Notification.count({ where: { userId, isRead: false } });
    return { unreadCount: count };
  }
}

module.exports = new NotificationService();
