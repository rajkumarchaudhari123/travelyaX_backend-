'use strict';

const router = require('express').Router();
const hotelController = require('../controllers/hotel.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { bookingLimiter } = require('../middlewares/rateLimiter.middleware');

// Public
router.get('/',          hotelController.getHotels);
router.get('/:hotelId',  hotelController.getHotelById);

// Protected
router.use(authenticate);

router.post('/book',                           authorize('rider'), bookingLimiter, hotelController.bookHotel);
router.get('/bookings/my',                     hotelController.getUserBookings);
router.get('/bookings/:bookingId',             hotelController.getBookingById);
router.post('/bookings/:bookingId/cancel',     authorize('rider'), hotelController.cancelBooking);

module.exports = router;
