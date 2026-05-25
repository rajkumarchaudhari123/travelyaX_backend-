'use strict';

/**
 * Send a successful API response.
 * @param {object} res         - Express response object
 * @param {*}      data        - Response payload
 * @param {string} message     - Success message
 * @param {number} statusCode  - HTTP status code (default 200)
 * @param {object} [meta]      - Optional metadata (pagination, etc.)
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta = null) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Send a created (201) response.
 */
const sendCreated = (res, data, message = 'Resource created successfully') => {
  return sendSuccess(res, data, message, 201);
};

/**
 * Send a paginated list response.
 * @param {object} res
 * @param {Array}  rows        - Array of records
 * @param {number} count       - Total record count
 * @param {number} page        - Current page number
 * @param {number} limit       - Items per page
 * @param {string} message
 */
const sendPaginated = (res, rows, count, page, limit, message = 'Success') => {
  const totalPages = Math.ceil(count / limit);

  return res.status(200).json({
    success: true,
    message,
    data: rows,
    meta: {
      total: count,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

/**
 * Send an error response.
 */
const sendError = (res, message, statusCode = 500, code = null, errors = null) => {
  const payload = {
    success: false,
    message,
    code: code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'REQUEST_ERROR'),
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Parse pagination query params with safe defaults.
 */
const parsePagination = (query, defaultLimit = 20, maxLimit = 100) => {
  const page  = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

module.exports = { sendSuccess, sendCreated, sendPaginated, sendError, parsePagination };
