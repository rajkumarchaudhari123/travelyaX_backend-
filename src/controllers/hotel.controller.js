'use strict';

const hotelService = require('../services/hotel.service');
const { sendSuccess, sendCreated, sendPaginated, parsePagination } = require('../utils/response');
const { validate, hotelSearchSchema, bookHotelSchema } = require('../utils/validators');
const { AppError } = require('../utils/AppError');

class HotelController {
  /**
   * GET /api/hotels
   * List / search hotels with filters
   */
  async getHotels(req, res, next) {
    try {
      const { value, error } = validate(hotelSearchSchema, req.query);
      if (error) return next(error);

      const { city, category, minPrice, maxPrice, rating, page, limit } = value;
      const { rows, count } = await hotelService.getHotels({
        city, category, minPrice, maxPrice, rating, page, limit,
      });

      return sendPaginated(res, rows, count, page, limit, 'Hotels retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/hotels/:hotelId
   * Get a single hotel
   */
  async getHotelById(req, res, next) {
    try {
      const hotelId = parseInt(req.params.hotelId, 10);
      if (!hotelId) return next(AppError.badRequest('Invalid hotel ID'));

      const hotel = await hotelService.getHotelById(hotelId);
      return sendSuccess(res, hotel, 'Hotel retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/hotels/book
   * Book a hotel room
   */
  async bookHotel(req, res, next) {
    try {
      const { value, error } = validate(bookHotelSchema, req.body);
      if (error) return next(error);

      const booking = await hotelService.bookHotel(req.userId, value);
      return sendCreated(res, booking, 'Hotel booking confirmed successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/hotels/bookings
   * Get user's hotel bookings
   */
  async getUserBookings(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { rows, count } = await hotelService.getUserBookings(req.userId, { page, limit });

      return sendPaginated(res, rows, count, page, limit, 'Hotel bookings retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/hotels/bookings/:bookingId
   * Get a single hotel booking
   */
  async getBookingById(req, res, next) {
    try {
      const bookingId = parseInt(req.params.bookingId, 10);
      if (!bookingId) return next(AppError.badRequest('Invalid booking ID'));

      const booking = await hotelService.getBookingById(bookingId);
      return sendSuccess(res, booking, 'Hotel booking retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/hotels/bookings/:bookingId/cancel
   * Cancel a hotel booking
   */
  async cancelBooking(req, res, next) {
    try {
      const bookingId = parseInt(req.params.bookingId, 10);
      if (!bookingId) return next(AppError.badRequest('Invalid booking ID'));

      const booking = await hotelService.cancelHotelBooking(req.userId, bookingId);
      return sendSuccess(res, booking, 'Hotel booking cancelled successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new HotelController();
