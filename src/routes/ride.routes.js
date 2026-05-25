'use strict';

const router = require('express').Router();
const rideController = require('../controllers/ride.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { bookingLimiter } = require('../middlewares/rateLimiter.middleware');

router.use(authenticate);

// Rider routes
router.post('/book',     authorize('rider'),          bookingLimiter, rideController.bookRide);
router.post('/cancel',   authorize('rider', 'driver'),                rideController.cancelRide);

// Driver routes
router.post('/accept',              authorize('driver'), rideController.acceptRide);
router.post('/:rideId/verify-otp',  authorize('driver'), rideController.verifyOtp);
router.post('/:rideId/start',       authorize('driver'), rideController.startRide);
router.post('/:rideId/complete',    authorize('driver'), rideController.completeRide);

// Shared routes
router.get('/',                      rideController.getRides);
router.get('/:rideId',               rideController.getRideById);
router.post('/:rideId/rate',         rideController.rateRide);

module.exports = router;
