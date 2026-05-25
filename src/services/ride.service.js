'use strict';

const { sequelize } = require('../config/db');
const { Ride, Driver, Wallet, Transaction, Notification, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { notifyDrivers, notifyUser } = require('./socket.service');
const { Op } = require('sequelize');

/** Generate a random 4-digit OTP */
const generateOtp = () => {
  return String(Math.floor(1000 + Math.random() * 9000));
};

// Fare calculation per km by ride type
const FARE_CONFIG = {
  mini:    { base: 2.0, perKm: 0.8, perMin: 0.10 },
  economy: { base: 3.0, perKm: 1.2, perMin: 0.15 },
  electric:{ base: 5.0, perKm: 1.6, perMin: 0.20 },
  premium: { base: 6.0, perKm: 2.0, perMin: 0.25 },
  suv:     { base: 8.0, perKm: 2.8, perMin: 0.35 },
};

const calculateFare = (rideType, distanceKm = 5, durationMin = 15) => {
  const config = FARE_CONFIG[rideType] || FARE_CONFIG.economy;
  const fare = config.base + config.perKm * distanceKm + config.perMin * durationMin;
  return parseFloat(fare.toFixed(2));
};

const SAFE_USER_ATTRS = ['id', 'fullName', 'phone', 'avatar'];

class RideService {
  /**
   * Book a new ride (rider only)
   */
  async bookRide(riderId, data) {
    const {
      pickupLocation, dropLocation, rideType,
      pickupLatitude, pickupLongitude, dropLatitude, dropLongitude,
    } = data;

    /* 
    // Rider cannot have two active rides at once
    const activeRide = await Ride.findOne({
      where: {
        riderId,
        status: { [Op.in]: ['pending', 'accepted', 'in_progress'] },
      },
    });
    if (activeRide) {
      throw AppError.conflict('You already have an active ride. Please wait for it to complete.');
    }
    */

    // Estimate distance (mock: 5–20 km random for now; replace with Maps API)
    const distance = parseFloat((Math.random() * 15 + 3).toFixed(2));
    const duration = Math.round(distance * 3.5); // ~3.5 min/km
    const fare = calculateFare(rideType, distance, duration);

    const ride = await Ride.create({
      riderId,
      pickupLocation,
      dropLocation,
      rideType,
      fare,
      distance,
      duration,
      pickupLatitude:  pickupLatitude  || null,
      pickupLongitude: pickupLongitude || null,
      dropLatitude:    dropLatitude    || null,
      dropLongitude:   dropLongitude   || null,
      status: 'pending',
    });

    // Notify driver(s) — simplified: notify all online approved drivers
    const onlineDrivers = await Driver.findAll({
      where: { isOnline: true, status: 'approved' },
      attributes: ['userId'],
    });

    if (onlineDrivers.length > 0) {
      const notifications = onlineDrivers.map((d) => ({
        userId:        d.userId,
        title:         '🚕 New Ride Request',
        message:       `New ${rideType} ride: ${pickupLocation} → ${dropLocation}. Fare: ₹${fare}`,
        type:          'ride',
        referenceId:   ride.id,
        referenceType: 'ride',
      }));
      await Notification.bulkCreate(notifications);
    }

    const populatedRide = await this.getRideById(ride.id);
    
    // Broadcast the real-time ride request to all connected drivers
    notifyDrivers('new_ride_request', populatedRide);

    return populatedRide;
  }

  /**
   * Driver accepts a pending ride
   */
  async acceptRide(driverId, rideId) {
    const t = await sequelize.transaction();
    try {
      const ride = await Ride.findByPk(rideId, { transaction: t, lock: t.LOCK.UPDATE });

      if (!ride) throw AppError.notFound('Ride');
      if (ride.status !== 'pending') {
        throw AppError.conflict(`Ride cannot be accepted. Current status: ${ride.status}`);
      }

      // Verify driver exists (Bypassed status/online check for testing)
      const driver = await Driver.findOne({
        where: { userId: driverId },
        transaction: t,
      });
      if (!driver) {
        throw AppError.forbidden('Driver profile not found');
      }

      /* 
      // Check driver doesn't already have an active ride
      const driverActiveRide = await Ride.findOne({
        where: {
          driverId,
          status: { [Op.in]: ['accepted', 'in_progress'] },
        },
        transaction: t,
      });
      if (driverActiveRide) {
        throw AppError.conflict('You already have an active ride in progress');
      }
      */

      // Generate 4-digit OTP for ride verification
      const otp = generateOtp();

      await ride.update(
        { driverId, status: 'accepted', acceptedAt: new Date(), otp },
        { transaction: t }
      );

      // Notify rider
      await Notification.create(
        {
          userId:        ride.riderId,
          title:         '✅ Driver Assigned',
          message:       'A driver has accepted your ride and is on the way!',
          type:          'ride',
          referenceId:   ride.id,
          referenceType: 'ride',
        },
        { transaction: t }
      );

      await t.commit();
      const populatedRide = await this.getRideById(ride.id);

      // Send ride data WITH OTP to the rider via socket
      const rideDataForRider = populatedRide.toJSON ? populatedRide.toJSON() : { ...populatedRide };
      rideDataForRider.otp = otp;
      notifyUser(ride.riderId, 'ride_accepted', rideDataForRider);

      return populatedRide;
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Verify OTP for a ride (driver enters OTP that rider sees)
   */
  async verifyOtp(driverId, rideId, enteredOtp) {
    const ride = await Ride.findOne({ where: { id: rideId, driverId } });
    if (!ride) throw AppError.notFound('Ride');
    if (ride.status !== 'accepted') {
      throw AppError.conflict('Ride must be in accepted status to verify OTP');
    }
    if (ride.isOtpVerified()) {
      throw AppError.conflict('OTP already verified for this ride');
    }
    if (ride.otp !== enteredOtp) {
      throw AppError.badRequest('Invalid OTP. Please check with the rider and try again.');
    }

    await ride.update({ otpVerifiedAt: new Date() });

    // Notify rider that OTP was verified
    notifyUser(ride.riderId, 'otp_verified', { rideId: ride.id });

    return this.getRideById(ride.id);
  }

  /**
   * Mark ride as in_progress (driver picks up rider)
   * Requires OTP verification first
   */
  async startRide(driverId, rideId) {
    const ride = await Ride.findOne({ where: { id: rideId, driverId } });
    if (!ride) throw AppError.notFound('Ride');
    if (ride.status !== 'accepted') {
      throw AppError.conflict('Ride must be in accepted status to start');
    }
    if (!ride.isOtpVerified()) {
      throw AppError.conflict('OTP must be verified before starting the ride');
    }

    await ride.update({ status: 'in_progress', startedAt: new Date() });

    await Notification.create({
      userId:        ride.riderId,
      title:         '🚗 Ride Started',
      message:       'Your ride has started. Enjoy your journey!',
      type:          'ride',
      referenceId:   ride.id,
      referenceType: 'ride',
    });

    const populatedRide = await this.getRideById(ride.id);

    // Notify rider that ride started
    notifyUser(ride.riderId, 'ride_started', populatedRide);

    // Notify driver with navigation data (pickup & drop coords)
    notifyUser(driverId, 'ride_started', populatedRide);

    return populatedRide;
  }

  /**
   * Complete a ride + handle payment
   */
  async completeRide(driverId, rideId) {
    const t = await sequelize.transaction();
    try {
      const ride = await Ride.findOne({
        where: { id: rideId, driverId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!ride) throw AppError.notFound('Ride');
      if (ride.status !== 'in_progress') {
        throw AppError.conflict('Only in-progress rides can be completed');
      }

      await ride.update({ status: 'completed', completedAt: new Date() }, { transaction: t });

      // Debit rider wallet (if sufficient balance)
      const riderWallet = await Wallet.findOne({ where: { userId: ride.riderId }, transaction: t, lock: t.LOCK.UPDATE });
      if (riderWallet && riderWallet.hasSufficientBalance(ride.fare)) {
        await riderWallet.debit(ride.fare, t);

        await Transaction.create({
          userId:        ride.riderId,
          walletId:      riderWallet.id,
          type:          'debit',
          amount:        ride.fare,
          balanceBefore: parseFloat(riderWallet.balance) + parseFloat(ride.fare),
          balanceAfter:  parseFloat(riderWallet.balance),
          category:      'ride_payment',
          description:   `Ride payment — ${ride.pickupLocation} to ${ride.dropLocation}`,
          reference:     String(ride.id),
          referenceType: 'ride',
          status:        'success',
        }, { transaction: t });
      }

      // Credit driver wallet
      const driverEarning = parseFloat((ride.fare * 0.80).toFixed(2)); // 80% to driver
      const driverWallet = await Wallet.findOne({ where: { userId: driverId }, transaction: t, lock: t.LOCK.UPDATE });
      if (driverWallet) {
        await driverWallet.credit(driverEarning, t);

        await Transaction.create({
          userId:        driverId,
          walletId:      driverWallet.id,
          type:          'credit',
          amount:        driverEarning,
          balanceBefore: parseFloat(driverWallet.balance) - driverEarning,
          balanceAfter:  parseFloat(driverWallet.balance),
          category:      'driver_earning',
          description:   `Ride earning — ${ride.pickupLocation} to ${ride.dropLocation}`,
          reference:     String(ride.id),
          referenceType: 'ride',
          status:        'success',
        }, { transaction: t });
      }

      // Update driver stats
      await Driver.update(
        {
          totalTrips:    sequelize.literal('totalTrips + 1'),
          totalEarnings: sequelize.literal(`totalEarnings + ${driverEarning}`),
        },
        { where: { userId: driverId }, transaction: t }
      );

      // Notify both parties
      await Notification.bulkCreate([
        {
          userId:  ride.riderId,
          title:   '🏁 Ride Completed',
          message: `Your ride is complete. ₹${ride.fare} has been charged. Please rate your driver!`,
          type:    'ride',
          referenceId: ride.id, referenceType: 'ride',
        },
        {
          userId:  driverId,
          title:   '💵 Earnings Added',
          message: `Ride completed! ₹${driverEarning} has been added to your wallet.`,
          type:    'payment',
          referenceId: ride.id, referenceType: 'ride',
        },
      ], { transaction: t });

      await t.commit();
      return this.getRideById(ride.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel a ride
   */
  async cancelRide(userId, userRole, rideId, reason = null) {
    const whereClause = { id: rideId };
    if (userRole === 'rider') whereClause.riderId = userId;
    if (userRole === 'driver') whereClause.driverId = userId;

    const ride = await Ride.findOne({ where: whereClause });
    if (!ride) throw AppError.notFound('Ride');
    if (!ride.isCancellable()) {
      throw AppError.conflict(`Ride in '${ride.status}' status cannot be cancelled`);
    }

    await ride.update({
      status:             'cancelled',
      cancellationReason: reason,
      cancelledBy:        userRole,
      cancelledAt:        new Date(),
    });

    // Notify the other party
    const notifyUserId = userRole === 'rider' ? ride.driverId : ride.riderId;
    if (notifyUserId) {
      await Notification.create({
        userId:        notifyUserId,
        title:         '❌ Ride Cancelled',
        message:       `Your ride has been cancelled by the ${userRole}.${reason ? ` Reason: ${reason}` : ''}`,
        type:          'ride',
        referenceId:   ride.id,
        referenceType: 'ride',
      });
    }

    return this.getRideById(ride.id);
  }

  /**
   * Get rides filtered by role
   */
  async getRides(userId, userRole, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    const whereClause = {};

    if (userRole === 'rider')  whereClause.riderId  = userId;
    if (userRole === 'driver') whereClause.driverId = userId;
    if (status) whereClause.status = status;

    const count = await Ride.count({ where: whereClause });
    const rows = await Ride.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'rider',  attributes: SAFE_USER_ATTRS },
        { model: User, as: 'driver', attributes: SAFE_USER_ATTRS },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return { rows, count };
  }

  /**
   * Rate a completed ride
   */
  async rateRide(userId, userRole, rideId, rating, note = null) {
    const t = await sequelize.transaction();
    try {
      const ride = await Ride.findByPk(rideId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!ride) throw AppError.notFound('Ride');
      if (ride.status !== 'completed') {
        throw AppError.conflict('Only completed rides can be rated');
      }

      const { notifyUser } = require('./socket.service');

      if (userRole === 'rider') {
        if (ride.riderId !== userId) throw AppError.forbidden('You can only rate your own rides');
        if (ride.driverRating) throw AppError.conflict('You have already rated this ride');

        await ride.update({ driverRating: rating, driverNote: note }, { transaction: t });

        // Calculate new driver rating
        const allDriverRides = await Ride.findAll({
          where: { driverId: ride.driverId, driverRating: { [Op.not]: null } },
          attributes: ['driverRating'],
          transaction: t
        });
        
        const totalRating = allDriverRides.reduce((sum, r) => sum + r.driverRating, 0);
        const avgRating = (totalRating / allDriverRides.length).toFixed(2);

        await Driver.update({ rating: avgRating }, { where: { userId: ride.driverId }, transaction: t });
        
        // Notify driver in real time
        notifyUser(ride.driverId, 'rating_updated', { newRating: avgRating, rideId: ride.id, receivedRating: rating, note });

      } else if (userRole === 'driver') {
        if (ride.driverId !== userId) throw AppError.forbidden('You can only rate your own assigned rides');
        if (ride.riderRating) throw AppError.conflict('You have already rated this rider');

        await ride.update({ riderRating: rating, riderNote: note }, { transaction: t });
        
        // Notify rider
        notifyUser(ride.riderId, 'rating_updated', { rideId: ride.id, receivedRating: rating, note });
      }

      await t.commit();
      return this.getRideById(ride.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get a single ride with full details
   */
  async getRideById(rideId) {
    const ride = await Ride.findByPk(rideId, {
      include: [
        { model: User, as: 'rider',  attributes: SAFE_USER_ATTRS },
        { 
          model: User, as: 'driver', attributes: SAFE_USER_ATTRS,
          include: [{ model: Driver, as: 'driverProfile', attributes: ['rating', 'totalTrips', 'vehicleModel', 'vehicleNumber'] }]
        },
      ],
    });
    if (!ride) throw AppError.notFound('Ride');
    return ride;
  }
}

module.exports = new RideService();
