'use strict';

const rateLimit = require('express-rate-limit');
const { AppError } = require('../utils/AppError');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next) => {
      next(AppError.tooManyRequests(message));
    },
  });

// General API limiter
const apiLimiter = createLimiter(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  'Too many requests from this IP. Please try again in 15 minutes.'
);

// Strict auth limiter
const authLimiter = createLimiter(
  15 * 60 * 1000,
  parseInt(process.env.AUTH_RATE_LIMIT_MAX || '10', 10),
  'Too many authentication attempts. Please try again in 15 minutes.'
);

// Booking limiter
const bookingLimiter = createLimiter(
  60 * 60 * 1000,
  30,
  'Too many booking requests. Please try again in 1 hour.'
);

module.exports = { apiLimiter, authLimiter, bookingLimiter };
