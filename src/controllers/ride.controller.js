'use strict';

const rideService = require('../services/ride.service');
const { sendSuccess, sendCreated, sendPaginated, parsePagination } = require('../utils/response');
const { validate, bookRideSchema, acceptRideSchema, cancelRideSchema, rateRideSchema, verifyOtpSchema } = require('../utils/validators');
const { AppError } = require('../utils/AppError');

class RideController {
  /**
   * POST /api/rides/book
   * Rider books a new ride
   */
  async bookRide(req, res, next) {
    try {
      const { value, error } = validate(bookRideSchema, req.body);
      if (error) return next(error);

      const ride = await rideService.bookRide(req.userId, value);
      return sendCreated(res, ride, 'Ride booked successfully. Looking for drivers...');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/accept
   * Driver accepts a pending ride
   */
  async acceptRide(req, res, next) {
    try {
      const { value, error } = validate(acceptRideSchema, req.body);
      if (error) return next(error);

      const ride = await rideService.acceptRide(req.userId, value.rideId);
      return sendSuccess(res, ride, 'Ride accepted successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/:rideId/verify-otp
   * Driver verifies OTP before starting ride
   */
  async verifyOtp(req, res, next) {
    try {
      const rideId = parseInt(req.params.rideId, 10);
      if (!rideId) return next(AppError.badRequest('Invalid ride ID'));

      const { value, error } = validate(verifyOtpSchema, req.body);
      if (error) return next(error);

      const ride = await rideService.verifyOtp(req.userId, rideId, value.otp);
      return sendSuccess(res, ride, 'OTP verified successfully. You can now start the ride.');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/:rideId/start
   * Driver starts a ride (picks up rider) — requires OTP verification
   */
  async startRide(req, res, next) {
    try {
      const rideId = parseInt(req.params.rideId, 10);
      if (!rideId) return next(AppError.badRequest('Invalid ride ID'));

      const ride = await rideService.startRide(req.userId, rideId);
      return sendSuccess(res, ride, 'Ride started');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/:rideId/complete
   * Driver marks ride as complete
   */
  async completeRide(req, res, next) {
    try {
      const rideId = parseInt(req.params.rideId, 10);
      if (!rideId) return next(AppError.badRequest('Invalid ride ID'));

      const ride = await rideService.completeRide(req.userId, rideId);
      return sendSuccess(res, ride, 'Ride completed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/cancel
   * Rider or driver cancels a ride
   */
  async cancelRide(req, res, next) {
    try {
      const { value, error } = validate(cancelRideSchema, req.body);
      if (error) return next(error);

      const ride = await rideService.cancelRide(
        req.userId,
        req.userRole,
        value.rideId,
        value.cancellationReason
      );
      return sendSuccess(res, ride, 'Ride cancelled');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/rides
   * Get rides filtered by role (rider → own rides, driver → assigned rides)
   */
  async getRides(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { status } = req.query;

      const { rows, count } = await rideService.getRides(
        req.userId,
        req.userRole,
        { page, limit, status }
      );

      return sendPaginated(res, rows, count, page, limit, 'Rides retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/rides/:rideId
   * Get a single ride by ID
   */
  async getRideById(req, res, next) {
    try {
      const rideId = parseInt(req.params.rideId, 10);
      if (!rideId) return next(AppError.badRequest('Invalid ride ID'));

      const ride = await rideService.getRideById(rideId);
      return sendSuccess(res, ride, 'Ride retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/rides/:rideId/rate
   * Rider or driver rates a completed ride
   */
  async rateRide(req, res, next) {
    try {
      const { value, error } = validate(rateRideSchema, { ...req.body, rideId: req.params.rideId });
      if (error) return next(error);

      const ride = await rideService.rateRide(req.userId, req.userRole, value.rideId, value.rating, value.note);
      return sendSuccess(res, ride, 'Ride rated successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new RideController();
