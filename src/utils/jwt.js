'use strict';

const jwt = require('jsonwebtoken');
const { AppError } = require('./AppError');

const JWT_SECRET          = process.env.JWT_SECRET;
const JWT_EXPIRES_IN      = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET  = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

/**
 * Sign an access token for a user.
 */
const signAccessToken = (payload) => {
  if (!JWT_SECRET) throw new Error('JWT_SECRET is not configured');
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'travelya-api',
    audience: 'travelya-client',
  });
};

/**
 * Sign a refresh token.
 */
const signRefreshToken = (payload) => {
  if (!JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET is not configured');
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES,
    issuer: 'travelya-api',
    audience: 'travelya-client',
  });
};

/**
 * Verify an access token. Returns decoded payload or throws AppError.
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET, {
      issuer: 'travelya-api',
      audience: 'travelya-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token has expired. Please login again.');
    }
    if (err.name === 'JsonWebTokenError') {
      throw AppError.unauthorized('Invalid access token.');
    }
    throw AppError.unauthorized('Token verification failed.');
  }
};

/**
 * Verify a refresh token. Returns decoded payload or throws AppError.
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET, {
      issuer: 'travelya-api',
      audience: 'travelya-client',
    });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Refresh token has expired. Please login again.');
    }
    throw AppError.unauthorized('Invalid refresh token.');
  }
};

/**
 * Generate both access + refresh tokens for a user.
 */
const generateTokenPair = (user) => {
  const payload = {
    id:    user.id,
    email: user.email,
    role:  user.role,
  };

  return {
    accessToken:  signAccessToken(payload),
    refreshToken: signRefreshToken({ id: user.id }),
  };
};

/**
 * Decode a token WITHOUT verifying signature (for inspection only).
 */
const decodeToken = (token) => jwt.decode(token);

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
  decodeToken,
};
