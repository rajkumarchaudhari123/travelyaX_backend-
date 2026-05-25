'use strict';

const { User, Driver, Wallet, Ride, BusBooking, HotelBooking } = require('../models');
const { AppError } = require('../utils/AppError');
const { Op } = require('sequelize');
const path = require('path');
const fs   = require('fs');

class UserService {
  /**
   * Get full profile for a user
   */
  async getProfile(userId) {
    const user = await User.findOne({
      where: { id: userId, isActive: true },
      include: [
        {
          model: Driver,
          as: 'driverProfile',
          required: false,
          attributes: [
            'id', 'licenseNumber', 'vehicleType', 'vehicleNumber',
            'vehicleModel', 'vehicleColor', 'vehicleYear',
            'status', 'isOnline', 'rating', 'totalTrips', 'totalEarnings',
          ],
        },
        {
          model: Wallet,
          as: 'wallet',
          required: false,
          attributes: ['id', 'balance', 'currency'],
        },
      ],
    });

    if (!user) throw AppError.notFound('User');

    // Compute stats
    const [totalRides, totalBusBookings, totalHotelBookings] = await Promise.all([
      Ride.count({
        where: {
          [Op.or]: [{ riderId: userId }, { driverId: userId }],
          status: 'completed',
        },
      }),
      BusBooking.count({ where: { userId, status: { [Op.in]: ['confirmed', 'completed'] } } }),
      HotelBooking.count({ where: { userId, status: { [Op.in]: ['confirmed', 'checked_out'] } } }),
    ]);

    return {
      ...user.toJSON(),
      stats: { totalRides, totalBusBookings, totalHotelBookings },
    };
  }

  /**
   * Update user profile (non-sensitive fields)
   */
  async updateProfile(userId, updates) {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User');

    const allowedFields = ['fullName', 'phone'];
    const filteredUpdates = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      throw AppError.badRequest('No valid fields to update');
    }

    // Check phone uniqueness if being updated
    if (filteredUpdates.phone) {
      const existing = await User.findOne({
        where: { phone: filteredUpdates.phone, id: { [Op.ne]: userId } },
      });
      if (existing) throw AppError.conflict('Phone number is already in use');
    }

    await user.update(filteredUpdates);
    return this.getProfile(userId);
  }

  /**
   * Update avatar
   */
  async updateAvatar(userId, file) {
    if (!file) throw AppError.badRequest('No file uploaded');

    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User');

    // Delete old avatar file if it exists and is local
    if (user.avatar && !user.avatar.startsWith('http')) {
      const oldPath = path.join(process.cwd(), user.avatar);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const avatarPath = `uploads/${file.filename}`;
    await user.update({ avatar: avatarPath });

    return { avatar: avatarPath };
  }

  /**
   * Toggle driver online status
   */
  async toggleDriverOnline(userId, isOnline) {
    const driver = await Driver.findOne({ where: { userId, status: 'approved' } });
    if (!driver) throw AppError.forbidden('Only approved drivers can toggle online status');

    await driver.update({ isOnline });
    return { isOnline, message: isOnline ? 'You are now online and receiving ride requests' : 'You are now offline' };
  }

  /**
   * Deactivate account
   */
  async deactivateAccount(userId) {
    const user = await User.findByPk(userId);
    if (!user) throw AppError.notFound('User');

    await user.update({ isActive: false, refreshToken: null });
    return { deactivated: true };
  }

  /**
   * Admin: list all users with filters
   */
  async listUsers({ role, isActive, search, driverStatus, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const where  = {};
    const driverWhere = {};

    if (role !== undefined)     where.role     = role;
    if (isActive !== undefined) where.isActive = isActive;
    if (driverStatus !== undefined) driverWhere.status = driverStatus;

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.like]: `%${search}%` } },
        { email:    { [Op.like]: `%${search}%` } },
        { phone:    { [Op.like]: `%${search}%` } },
      ];
    }

    const count = await User.count({ 
      where, 
      include: Object.keys(driverWhere).length > 0 ? [{ model: Driver, as: 'driverProfile', where: driverWhere }] : undefined 
    });
    const rows = await User.findAll({
      where,
      include: [
        { 
          model: Driver, 
          as: 'driverProfile', 
          required: Object.keys(driverWhere).length > 0, 
          where: Object.keys(driverWhere).length > 0 ? driverWhere : undefined,
          attributes: ['id', 'status', 'vehicleType'] 
        },
        { model: Wallet, as: 'wallet', required: false, attributes: ['balance', 'currency'] },
      ],
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit, 10),
      offset,
    });

    return { rows, count };
  }

  /**
   * Admin: approve or reject a driver
   */
  async reviewDriverApplication(driverId, status, rejectionReason = null) {
    const driver = await Driver.findByPk(driverId);
    if (!driver) throw AppError.notFound('Driver profile');

    if (!['approved', 'rejected', 'suspended'].includes(status)) {
      throw AppError.badRequest('Status must be approved, rejected, or suspended');
    }

    const updates = { status };
    if (status === 'approved')  updates.approvedAt = new Date();
    if (status === 'rejected')  updates.rejectionReason = rejectionReason;

    await driver.update(updates);

    // Notify driver
    const notifMessages = {
      approved: { title: '🎉 Driver Approved!', message: 'Your driver application has been approved. You can now start accepting rides!' },
      rejected: { title: '❌ Application Rejected', message: `Your driver application was rejected. ${rejectionReason ? `Reason: ${rejectionReason}` : 'Please contact support.'}` },
      suspended: { title: '⚠️ Account Suspended', message: 'Your driver account has been temporarily suspended. Please contact support.' },
    };

    await require('../models').Notification.create({
      userId: driver.userId,
      ...notifMessages[status],
      type: 'system',
    });

    return driver;
  }
}

module.exports = new UserService();
