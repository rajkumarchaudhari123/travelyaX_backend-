'use strict';

const { AppError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Convert Sequelize errors to AppErrors for consistent responses.
 */
const handleSequelizeErrors = (err) => {
  // Unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'field';
    const value = err.errors[0]?.value || '';
    return AppError.conflict(`${field} '${value}' is already in use`);
  }

  // Validation error from Sequelize model validators
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return AppError.validationError('Model validation failed', errors);
  }

  // Foreign key constraint
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return AppError.badRequest('Referenced resource does not exist');
  }

  // Database connection error
  if (err.name === 'SequelizeConnectionError' || err.name === 'SequelizeConnectionRefusedError') {
    return AppError.internal('Database connection failed');
  }

  // Invalid column / table
  if (err.name === 'SequelizeDatabaseError') {
    logger.error('Sequelize database error:', { message: err.message });
    return AppError.internal('A database error occurred');
  }

  return null;
};

/**
 * Handle JWT-specific errors.
 */
const handleJwtErrors = (err) => {
  if (err.name === 'JsonWebTokenError') {
    return AppError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return AppError.unauthorized('Authentication token has expired');
  }
  return null;
};

/**
 * Handle Multer file upload errors.
 */
const handleMulterErrors = (err) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return AppError.badRequest(
      `File too large. Maximum allowed size is ${(parseInt(process.env.MAX_FILE_SIZE || '5242880') / 1024 / 1024).toFixed(0)}MB`
    );
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return AppError.badRequest('Too many files uploaded');
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return AppError.badRequest(`Unexpected field: ${err.field}`);
  }
  return null;
};

/**
 * Format error response payload.
 */
const formatError = (err, isDev) => {
  const payload = {
    success: false,
    message: err.message,
    code:    err.code || 'ERROR',
  };

  if (err.errors) {
    payload.errors = err.errors;
  }

  if (isDev) {
    payload.stack  = err.stack;
    payload.detail = err;
  }

  return payload;
};

// ─── 404 Handler ─────────────────────────────────────────────────────────────
const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl}`));
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
const globalErrorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';

  // Log all errors
  if (err.statusCode >= 500 || !err.isOperational) {
    logger.error(`[${req.method}] ${req.originalUrl}`, {
      message: err.message,
      stack:   err.stack,
      userId:  req.userId,
      ip:      req.ip,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} — ${err.statusCode}: ${err.message}`);
  }

  // Convert known error types to AppError
  let error = err;

  if (!err.isOperational) {
    const seqErr    = handleSequelizeErrors(err);
    const jwtErr    = handleJwtErrors(err);
    const multerErr = handleMulterErrors(err);

    error = seqErr || jwtErr || multerErr || AppError.internal(
      isDev ? err.message : 'An unexpected error occurred. Please try again.'
    );
  }

  return res.status(error.statusCode || 500).json(formatError(error, isDev));
};

module.exports = { notFoundHandler, globalErrorHandler };
