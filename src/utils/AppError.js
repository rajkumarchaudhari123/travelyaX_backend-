'use strict';

/**
 * Custom operational error class for predictable, handled errors.
 * Distinguish between operational errors (user errors, known issues)
 * and programming errors (bugs) for proper handling.
 */
class AppError extends Error {
  /**
   * @param {string}  message    - Human-readable error message
   * @param {number}  statusCode - HTTP status code (default 500)
   * @param {string}  [code]     - Machine-readable error code
   * @param {object}  [errors]   - Validation error details
   */
  constructor(message, statusCode = 500, code = null, errors = null) {
    super(message);

    this.name       = 'AppError';
    this.statusCode = statusCode;
    this.status     = statusCode >= 400 && statusCode < 500 ? 'fail' : 'error';
    this.code       = code || this._defaultCode(statusCode);
    this.errors     = errors;
    this.isOperational = true;

    // Capture stack trace excluding constructor
    Error.captureStackTrace(this, this.constructor);
  }

  _defaultCode(statusCode) {
    const codes = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'RATE_LIMIT_EXCEEDED',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return codes[statusCode] || 'UNKNOWN_ERROR';
  }

  // ─── Static Factory Methods ───────────────────────────────────────────────

  static badRequest(message, errors = null) {
    return new AppError(message, 400, 'BAD_REQUEST', errors);
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(message, 401, 'UNAUTHORIZED');
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(message, 403, 'FORBIDDEN');
  }

  static notFound(resource = 'Resource') {
    return new AppError(`${resource} not found`, 404, 'NOT_FOUND');
  }

  static conflict(message) {
    return new AppError(message, 409, 'CONFLICT');
  }

  static validationError(message, errors = null) {
    return new AppError(message, 422, 'VALIDATION_ERROR', errors);
  }

  static tooManyRequests(message = 'Too many requests, please try again later') {
    return new AppError(message, 429, 'RATE_LIMIT_EXCEEDED');
  }

  static internal(message = 'An unexpected error occurred') {
    return new AppError(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

module.exports = { AppError };
