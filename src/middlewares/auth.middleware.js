'use strict';

const { verifyAccessToken } = require('../utils/jwt');
const { AppError } = require('../utils/AppError');
const { User } = require('../models');

/**
 * Protect routes — verify JWT and attach user to req.user
 */
const authenticate = async (req, res, next) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('No authentication token provided'));
    }

    const token = authHeader.split(' ')[1];
    if (!token || token === 'undefined') {
      return next(AppError.unauthorized('Invalid token format'));
    }

    // 2. Verify token
    const decoded = verifyAccessToken(token);

    // 3. Fetch user from DB to ensure account still exists and is active
    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      attributes: ['id', 'fullName', 'email', 'phone', 'role', 'isActive', 'avatar'],
    });

    if (!user) {
      return next(AppError.unauthorized('Account not found or has been deactivated'));
    }

    // 4. Attach to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Restrict access to specific roles.
 * Usage: authorize('admin'), authorize('admin', 'driver')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. This route is restricted to: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};

/**
 * Only the resource owner or admin can proceed.
 * Extracts the owner ID from req.params[paramName].
 */
const ownerOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceOwnerId = parseInt(req.params[paramName], 10);

    if (req.user.role === 'admin' || req.user.id === resourceOwnerId) {
      return next();
    }

    return next(AppError.forbidden('You do not have permission to access this resource'));
  };
};

/**
 * Optional authentication — attach user if token present, but don't fail.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) return next();

    const decoded = verifyAccessToken(token);
    const user = await User.findOne({
      where: { id: decoded.id, isActive: true },
      attributes: ['id', 'fullName', 'email', 'role'],
    });

    if (user) {
      req.user = user;
      req.userId = user.id;
      req.userRole = user.role;
    }

    next();
  } catch {
    // Silently ignore auth errors for optional routes
    next();
  }
};

module.exports = { authenticate, authorize, ownerOrAdmin, optionalAuth };
