'use strict';

const Joi = require('joi');

// ─── Reusable field definitions ───────────────────────────────────────────────
const fields = {
  email: Joi.string().email({ tlds: { allow: false } }).lowercase().trim().max(150),
  password: Joi.string().min(8).max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'strong password'),
  phone: Joi.string().trim().pattern(/^[+]?[\d\s\-()]{8,20}$/),
  fullName: Joi.string().trim().min(2).max(100),
  id: Joi.number().integer().positive(),
  pagination: {
    page:  Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
  },
};

// ─── Auth Schemas ─────────────────────────────────────────────────────────────
const registerRiderSchema = Joi.object({
  fullName: fields.fullName.required(),
  phone:    fields.phone.required(),
  email:    fields.email.required(),
  password: fields.password.required().messages({
    'string.pattern.name': 'Password must contain uppercase, lowercase, and a number',
  }),
});

const registerDriverSchema = Joi.object({
  fullName:     fields.fullName.required(),
  phone:        fields.phone.required(),
  email:        fields.email.required(),
  password:     fields.password.required().messages({
    'string.pattern.name': 'Password must contain uppercase, lowercase, and a number',
  }),
  licenseNumber: Joi.string().trim().min(4).max(50).required(),
  vehicleType:   Joi.string().valid('Sedan','SUV','Hatchback','Van','Motorcycle').required(),
  vehicleNumber: Joi.string().trim().min(2).max(30).required(),
  vehicleModel:  Joi.string().trim().min(2).max(100).required(),
  vehicleColor:  Joi.string().trim().max(30).optional(),
  vehicleYear:   Joi.number().integer().min(1990).max(new Date().getFullYear() + 1).optional(),
});

const loginSchema = Joi.object({
  email:    fields.email.required(),
  password: Joi.string().required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

// ─── Ride Schemas ─────────────────────────────────────────────────────────────
const bookRideSchema = Joi.object({
  pickupLocation: Joi.string().trim().min(3).max(255).required(),
  dropLocation:   Joi.string().trim().min(3).max(255).required(),
  rideType:       Joi.string().valid('mini','economy','premium','suv').required(),
  pickupLatitude:  Joi.number().min(-90).max(90).optional(),
  pickupLongitude: Joi.number().min(-180).max(180).optional(),
  dropLatitude:    Joi.number().min(-90).max(90).optional(),
  dropLongitude:   Joi.number().min(-180).max(180).optional(),
});

const acceptRideSchema = Joi.object({
  rideId: fields.id.required(),
});

const cancelRideSchema = Joi.object({
  rideId:             fields.id.required(),
  cancellationReason: Joi.string().trim().max(500).optional(),
});

const rateRideSchema = Joi.object({
  rideId: fields.id.required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  note:   Joi.string().trim().max(500).optional(),
});

const verifyOtpSchema = Joi.object({
  otp: Joi.string().trim().length(4).pattern(/^\d{4}$/).required()
    .messages({
      'string.length': 'OTP must be exactly 4 digits',
      'string.pattern.base': 'OTP must contain only numbers',
    }),
});

// ─── Bus Schemas ──────────────────────────────────────────────────────────────
const busSearchSchema = Joi.object({
  source:      Joi.string().trim().min(2).max(100).optional(),
  destination: Joi.string().trim().min(2).max(100).optional(),
  date:        Joi.date().iso().optional(),
  busType:     Joi.string().valid('AC','Non-AC','Sleeper','Volvo','Luxury').optional(),
  ...fields.pagination,
});

const bookBusSchema = Joi.object({
  busId:          fields.id.required(),
  seatNumbers:    Joi.array().items(Joi.number().integer().min(1)).min(1).max(6).required(),
  passengerName:  Joi.string().trim().min(2).max(100).required(),
  passengerPhone: fields.phone.required(),
  passengerEmail: fields.email.optional(),
  boardingPoint:  Joi.string().trim().max(200).optional(),
  droppingPoint:  Joi.string().trim().max(200).optional(),
  paymentMethod:  Joi.string().valid('wallet','card','upi','cash').default('wallet'),
});

// ─── Hotel Schemas ────────────────────────────────────────────────────────────
const hotelSearchSchema = Joi.object({
  city:     Joi.string().trim().min(2).max(100).optional(),
  category: Joi.string().valid('budget','standard','deluxe','luxury').optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  rating:   Joi.number().min(0).max(5).optional(),
  ...fields.pagination,
});

const bookHotelSchema = Joi.object({
  hotelId:        fields.id.required(),
  checkIn:        Joi.date().iso().min('now').required(),
  checkOut:       Joi.date().iso().greater(Joi.ref('checkIn')).required()
    .messages({ 'date.greater': 'Check-out must be after check-in' }),
  guests:         Joi.number().integer().min(1).max(20).default(1),
  rooms:          Joi.number().integer().min(1).max(10).default(1),
  roomType:       Joi.string().trim().max(50).default('standard'),
  guestName:      Joi.string().trim().min(2).max(100).required(),
  guestPhone:     fields.phone.required(),
  guestEmail:     fields.email.optional(),
  paymentMethod:  Joi.string().valid('wallet','card','upi','cash').default('wallet'),
  specialRequests: Joi.string().trim().max(500).optional(),
});

// ─── Wallet Schemas ───────────────────────────────────────────────────────────
const topUpWalletSchema = Joi.object({
  amount:        Joi.number().positive().max(10000).required(),
  paymentMethod: Joi.string().valid('card','upi','bank_transfer').required(),
});

const withdrawWalletSchema = Joi.object({
  amount:         Joi.number().positive().max(5000).required(),
  bankAccount:    Joi.string().trim().optional(),
  upiId:          Joi.string().trim().optional(),
});

// ─── Generic validation runner ────────────────────────────────────────────────
/**
 * Validate data against a Joi schema.
 * Returns { value, error } where error is an AppError or null.
 */
const validate = (schema, data, options = {}) => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options,
  });

  if (error) {
    const { AppError } = require('./AppError');
    const errors = error.details.map((d) => ({
      field:   d.path.join('.'),
      message: d.message.replace(/['"]/g, ''),
    }));
    return {
      value: null,
      error: AppError.validationError('Validation failed', errors),
    };
  }

  return { value, error: null };
};

module.exports = {
  validate,
  registerRiderSchema,
  registerDriverSchema,
  loginSchema,
  refreshTokenSchema,
  bookRideSchema,
  acceptRideSchema,
  cancelRideSchema,
  rateRideSchema,
  verifyOtpSchema,
  busSearchSchema,
  bookBusSchema,
  hotelSearchSchema,
  bookHotelSchema,
  topUpWalletSchema,
  withdrawWalletSchema,
};
