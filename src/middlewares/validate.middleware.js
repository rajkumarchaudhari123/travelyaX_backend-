'use strict';

const { validate } = require('../utils/validators');

/**
 * Middleware factory: validate req.body against a Joi schema.
 *
 * Usage:
 *   router.post('/endpoint', validateBody(mySchema), controller);
 */
const validateBody = (schema) => (req, res, next) => {
  const { value, error } = validate(schema, req.body);
  if (error) return next(error);
  req.body = value; // Replace with sanitized/coerced value
  next();
};

/**
 * Middleware factory: validate req.query against a Joi schema.
 */
const validateQuery = (schema) => (req, res, next) => {
  const { value, error } = validate(schema, req.query);
  if (error) return next(error);
  req.query = value;
  next();
};

/**
 * Middleware factory: validate req.params against a Joi schema.
 */
const validateParams = (schema) => (req, res, next) => {
  const { value, error } = validate(schema, req.params);
  if (error) return next(error);
  req.params = value;
  next();
};

module.exports = { validateBody, validateQuery, validateParams };
