'use strict';

const router = require('express').Router();

const authRoutes         = require('./auth.routes');
const userRoutes         = require('./user.routes');
const rideRoutes         = require('./ride.routes');
const busRoutes          = require('./bus.routes');
const hotelRoutes        = require('./hotel.routes');
const walletRoutes       = require('./wallet.routes');
const transactionRoutes  = require('./transaction.routes');
const notificationRoutes = require('./notification.routes');
const uploadRoutes       = require('./upload.routes');
const tripPlanRoutes     = require('./tripPlan.routes');
const businessRoutes     = require('./business.routes');

// ─── Health check ─────────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Travelya API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── Mount routes ─────────────────────────────────────────────────────────────
router.use('/auth',          authRoutes);
router.use('/users',         userRoutes);
router.use('/rides',         rideRoutes);
router.use('/buses',         busRoutes);
router.use('/hotels',        hotelRoutes);
router.use('/wallet',        walletRoutes);
router.use('/transactions',  transactionRoutes);
router.use('/notifications', notificationRoutes);
router.use('/upload',        uploadRoutes);
router.use('/trip-plans',    tripPlanRoutes);
router.use('/business',      businessRoutes);

module.exports = router;
