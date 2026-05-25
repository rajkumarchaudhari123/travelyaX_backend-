'use strict';

const { sequelize } = require('../config/db');
const { User, Driver, Wallet, Notification } = require('../models');
const { generateTokenPair, verifyRefreshToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Register a new Rider
   */
  async registerRider(data) {
    const t = await sequelize.transaction();
    try {
      const { fullName, phone, email, password } = data;

      // Check uniqueness
      const existing = await User.unscoped().findOne({
        where: { email },
        transaction: t,
      });
      if (existing) throw AppError.conflict('Email address is already registered');

      const phoneExists = await User.unscoped().findOne({
        where: { phone },
        transaction: t,
      });
      if (phoneExists) throw AppError.conflict('Phone number is already registered');

      // Create user (password hashed via beforeCreate hook)
      const user = await User.create(
        { fullName, phone, email, password, role: 'rider' },
        { transaction: t }
      );

      // Auto-create wallet for new rider
      await Wallet.create({ userId: user.id, balance: 0 }, { transaction: t });

      // Welcome notification
      await Notification.create(
        {
          userId:  user.id,
          title:   'Welcome to Travelya! 🎉',
          message: 'Your account has been created. Start exploring rides, buses, and hotels.',
          type:    'system',
        },
        { transaction: t }
      );

      await t.commit();

      const { accessToken, refreshToken } = generateTokenPair(user);

      // Store refresh token
      await User.unscoped().update(
        { refreshToken, lastLoginAt: new Date() },
        { where: { id: user.id } }
      );

      logger.info(`New rider registered: ${email}`);

      return {
        user: user.toSafeObject(),
        accessToken,
        refreshToken,
        role: 'rider',
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Register a new Driver
   */
  async registerDriver(data) {
    const t = await sequelize.transaction();
    try {
      const {
        fullName, phone, email, password,
        licenseNumber, vehicleType, vehicleNumber, vehicleModel, vehicleColor, vehicleYear,
      } = data;

      // Check email/phone uniqueness
      const emailExists = await User.unscoped().findOne({ where: { email }, transaction: t });
      if (emailExists) throw AppError.conflict('Email address is already registered');

      const phoneExists = await User.unscoped().findOne({ where: { phone }, transaction: t });
      if (phoneExists) throw AppError.conflict('Phone number is already registered');

      // Check license/vehicle uniqueness
      const licenseExists = await Driver.findOne({ where: { licenseNumber }, transaction: t });
      if (licenseExists) throw AppError.conflict('License number is already registered');

      const vehicleExists = await Driver.findOne({ where: { vehicleNumber }, transaction: t });
      if (vehicleExists) throw AppError.conflict('Vehicle number is already registered');

      // Create user
      const user = await User.create(
        { fullName, phone, email, password, role: 'driver' },
        { transaction: t }
      );

      // Create driver profile
      const driver = await Driver.create(
        {
          userId: user.id,
          licenseNumber,
          vehicleType,
          vehicleNumber,
          vehicleModel,
          vehicleColor: vehicleColor || null,
          vehicleYear:  vehicleYear || null,
          status: 'pending',
        },
        { transaction: t }
      );

      // Auto-create wallet for driver
      await Wallet.create({ userId: user.id, balance: 0 }, { transaction: t });

      // Welcome + verification pending notification
      await Notification.create(
        {
          userId:  user.id,
          title:   'Driver Registration Submitted 🚗',
          message: 'Your driver application is under review. You will be notified once approved (24–48 hours).',
          type:    'system',
        },
        { transaction: t }
      );

      await t.commit();

      const { accessToken, refreshToken } = generateTokenPair(user);

      await User.unscoped().update(
        { refreshToken, lastLoginAt: new Date() },
        { where: { id: user.id } }
      );

      logger.info(`New driver registered: ${email} (status: pending)`);

      return {
        user:   user.toSafeObject(),
        driver: { id: driver.id, status: driver.status },
        accessToken,
        refreshToken,
        role: 'driver',
      };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Login user (rider, driver, or admin)
   */
  async login(email, password) {
    // Fetch with password (use unscoped to bypass defaultScope exclusion)
    const user = await User.scope('withPassword').findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.unauthorized('Your account has been deactivated. Please contact support.');

    const isMatch = await user.comparePassword(password);
    if (!isMatch) throw AppError.unauthorized('Invalid email or password');

    const { accessToken, refreshToken } = generateTokenPair(user);

    // Update refresh token and last login
    await User.unscoped().update(
      { refreshToken, lastLoginAt: new Date() },
      { where: { id: user.id } }
    );

    // Fetch driver profile if driver
    let driverProfile = null;
    if (user.role === 'driver') {
      driverProfile = await Driver.findOne({
        where: { userId: user.id },
        attributes: ['id', 'status', 'isOnline', 'vehicleType', 'vehicleModel', 'rating'],
      });

      if (driverProfile && driverProfile.status === 'rejected') {
        throw AppError.forbidden(
          'Your driver application was rejected. Please contact support for details.'
        );
      }
    }

    logger.info(`User logged in: ${email} (role: ${user.role})`);

    return {
      user: user.toSafeObject(),
      driver: driverProfile,
      accessToken,
      refreshToken,
      role: user.role,
      userId: user.id,
    };
  }

  /**
   * Refresh access token using a refresh token
   */
  async refreshAccessToken(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const user = await User.unscoped().scope('withRefreshToken').findOne({
      where: { id: decoded.id, isActive: true },
    });

    if (!user || user.refreshToken !== refreshToken) {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const { accessToken, refreshToken: newRefresh } = generateTokenPair(user);

    await User.unscoped().update(
      { refreshToken: newRefresh },
      { where: { id: user.id } }
    );

    return { accessToken, refreshToken: newRefresh };
  }

  /**
   * Logout — invalidate refresh token
   */
  async logout(userId) {
    await User.unscoped().update(
      { refreshToken: null },
      { where: { id: userId } }
    );
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.scope('withPassword').findByPk(userId);
    if (!user) throw AppError.notFound('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw AppError.badRequest('Current password is incorrect');

    await user.update({ password: newPassword });
    logger.info(`Password changed for user: ${userId}`);
  }
}

module.exports = new AuthService();
