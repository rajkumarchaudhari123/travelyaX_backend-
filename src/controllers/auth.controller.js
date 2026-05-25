'use strict';

const authService = require('../services/auth.service');
const { sendSuccess, sendCreated } = require('../utils/response');
const {
  validate,
  registerRiderSchema,
  registerDriverSchema,
  loginSchema,
  refreshTokenSchema,
} = require('../utils/validators');
const { AppError } = require('../utils/AppError');

class AuthController {
  /**
   * POST /api/auth/register-rider
   */
  async registerRider(req, res, next) {
    try {
      const { value, error } = validate(registerRiderSchema, req.body);
      if (error) return next(error);

      const result = await authService.registerRider(value);

      return sendCreated(res, result, 'Rider account created successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/register-driver
   */
  async registerDriver(req, res, next) {
    try {
      const { value, error } = validate(registerDriverSchema, req.body);
      if (error) return next(error);

      const result = await authService.registerDriver(value);

      return sendCreated(
        res,
        result,
        'Driver account created. Pending admin verification (24-48 hours).'
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      const { value, error } = validate(loginSchema, req.body);
      if (error) return next(error);

      const result = await authService.login(value.email, value.password);

      return sendSuccess(res, result, 'Login successful');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { value, error } = validate(refreshTokenSchema, req.body);
      if (error) return next(error);

      const tokens = await authService.refreshAccessToken(value.refreshToken);

      return sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      await authService.logout(req.userId);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return next(AppError.badRequest('currentPassword and newPassword are required'));
      }
      if (newPassword.length < 8) {
        return next(AppError.badRequest('New password must be at least 8 characters'));
      }

      await authService.changePassword(req.userId, currentPassword, newPassword);

      return sendSuccess(res, null, 'Password changed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   */
  async getMe(req, res, next) {
    try {
      return sendSuccess(res, { user: req.user }, 'User info retrieved');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
