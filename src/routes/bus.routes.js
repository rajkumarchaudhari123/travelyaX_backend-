'use strict';

const router = require('express').Router();
const busController = require('../controllers/bus.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { bookingLimiter } = require('../middlewares/rateLimiter.middleware');

// Public
router.get('/',       busController.getBuses);
router.get('/:busId', busController.getBusById);

// Protected
router.use(authenticate);

router.post('/book',                              authorize('rider'), bookingLimiter, busController.bookBus);
router.get('/bookings/my',                        busController.getUserBookings);
router.get('/bookings/:bookingId',                busController.getBookingById);
router.post('/bookings/:bookingId/cancel',        authorize('rider'), busController.cancelBooking);

module.exports = router;
