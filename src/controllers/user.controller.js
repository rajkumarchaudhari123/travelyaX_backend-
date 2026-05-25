'use strict';

const userService = require('../services/user.service');
const { sendSuccess, sendPaginated, parsePagination } = require('../utils/response');
const { uploadSingle } = require('../config/multer');

class UserController {
  /**
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const profile = await userService.getProfile(req.userId);
      return sendSuccess(res, profile, 'Profile retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      const updated = await userService.updateProfile(req.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/users/avatar
   */
  async updateAvatar(req, res, next) {
    try {
      const result = await userService.updateAvatar(req.userId, req.file);
      return sendSuccess(res, result, 'Avatar updated successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/users/driver/online-status
   */
  async toggleOnlineStatus(req, res, next) {
    try {
      const { isOnline } = req.body;
      if (typeof isOnline !== 'boolean') {
        return next(require('../utils/AppError').AppError.badRequest('isOnline must be a boolean'));
      }
      const result = await userService.toggleDriverOnline(req.userId, isOnline);
      return sendSuccess(res, result, result.message);
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/users/account
   */
  async deactivateAccount(req, res, next) {
    try {
      const result = await userService.deactivateAccount(req.userId);
      return sendSuccess(res, result, 'Account deactivated successfully');
    } catch (err) {
      next(err);
    }
  }

  // ─── Admin Routes ───────────────────────────────────────────────────────────

  /**
   * GET /api/admin/users
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit, offset } = parsePagination(req.query);
      const { role, isActive, search, driverStatus } = req.query;

      const { rows, count } = await userService.listUsers({
        role,
        driverStatus,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        search,
        page,
        limit,
      });

      return sendPaginated(res, rows, count, page, limit, 'Users retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/admin/drivers/:driverId/review
   */
  async reviewDriverApplication(req, res, next) {
    try {
      const { driverId } = req.params;
      const { status, rejectionReason } = req.body;

      const driver = await userService.reviewDriverApplication(
        parseInt(driverId, 10),
        status,
        rejectionReason
      );
      return sendSuccess(res, driver, `Driver application ${status}`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
