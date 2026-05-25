'use strict';

const busService = require('../services/bus.service');
const { sendSuccess, sendCreated, sendPaginated, parsePagination } = require('../utils/response');
const { validate, busSearchSchema, bookBusSchema } = require('../utils/validators');
const { AppError } = require('../utils/AppError');

class BusController {
  /**
   * GET /api/buses
   * Search / list buses with optional filters
   */
  async getBuses(req, res, next) {
    try {
      const { value, error } = validate(busSearchSchema, req.query);
      if (error) return next(error);

      const { source, destination, date, busType, page, limit } = value;
      const { rows, count } = await busService.getBuses({
        source, destination, date, busType, page, limit,
      });

      return sendPaginated(res, rows, count, page, limit, 'Buses retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/buses/:busId
   * Get single bus details
   */
  async getBusById(req, res, next) {
    try {
      const busId = parseInt(req.params.busId, 10);
      if (!busId) return next(AppError.badRequest('Invalid bus ID'));

      const bus = await busService.getBusById(busId);
      return sendSuccess(res, bus, 'Bus retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/buses/book
   * Book bus seats
   */
  async bookBus(req, res, next) {
    try {
      const { value, error } = validate(bookBusSchema, req.body);
      if (error) return next(error);

      const booking = await busService.bookBus(req.userId, value);
      return sendCreated(res, booking, 'Bus booking confirmed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/buses/bookings
   * Get current user's bus bookings
   */
  async getUserBookings(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { rows, count } = await busService.getUserBookings(req.userId, { page, limit });

      return sendPaginated(res, rows, count, page, limit, 'Bus bookings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/buses/bookings/:bookingId
   * Get a single booking by ID
   */
  async getBookingById(req, res, next) {
    try {
      const bookingId = parseInt(req.params.bookingId, 10);
      if (!bookingId) return next(AppError.badRequest('Invalid booking ID'));

      const booking = await busService.getBookingById(bookingId);
      return sendSuccess(res, booking, 'Booking retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/buses/bookings/:bookingId/cancel
   * Cancel a bus booking
   */
  async cancelBooking(req, res, next) {
    try {
      const bookingId = parseInt(req.params.bookingId, 10);
      if (!bookingId) return next(AppError.badRequest('Invalid booking ID'));

      const booking = await busService.cancelBusBooking(req.userId, bookingId);
      return sendSuccess(res, booking, 'Bus booking cancelled successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new BusController();
