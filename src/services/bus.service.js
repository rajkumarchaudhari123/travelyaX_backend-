'use strict';

const { sequelize } = require('../config/db');
const { Bus, BusBooking, Wallet, Transaction, Notification, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { Op } = require('sequelize');

class BusService {
  /**
   * Search / list available buses with optional filters
   */
  async getBuses({ source, destination, date, busType, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const where  = { isActive: true };

    if (source)      where.source      = { [Op.like]: `%${source}%` };
    if (destination) where.destination = { [Op.like]: `%${destination}%` };
    if (busType)     where.busType     = busType;
    if (date)        where.travelDate  = date;

    // Only buses with available seats
    where[Op.and] = sequelize.literal('`Bus`.`bookedSeats` < `Bus`.`totalSeats`');

    const { rows, count } = await Bus.findAndCountAll({
      where,
      order:  [['departureTime', 'ASC']],
      limit:  parseInt(limit, 10),
      offset,
    });

    // Attach availableSeats virtual field
    const enriched = rows.map((bus) => ({
      ...bus.toJSON(),
      availableSeats: bus.totalSeats - bus.bookedSeats,
    }));

    return { rows: enriched, count };
  }

  /**
   * Get a single bus by ID
   */
  async getBusById(busId) {
    const bus = await Bus.findOne({ where: { id: busId, isActive: true } });
    if (!bus) throw AppError.notFound('Bus');
    return { ...bus.toJSON(), availableSeats: bus.totalSeats - bus.bookedSeats };
  }

  /**
   * Book bus seats
   */
  async bookBus(userId, data) {
    const t = await sequelize.transaction();
    try {
      const {
        busId, seatNumbers, passengerName, passengerPhone, passengerEmail,
        boardingPoint, droppingPoint, paymentMethod,
      } = data;

      // Lock bus row for seat availability check
      const bus = await Bus.findOne({
        where: { id: busId, isActive: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!bus) throw AppError.notFound('Bus');

      const available = bus.totalSeats - bus.bookedSeats;
      if (seatNumbers.length > available) {
        throw AppError.conflict(
          `Only ${available} seat(s) available. You requested ${seatNumbers.length}.`
        );
      }

      // Check if any requested seats are already taken
      const existingBookings = await BusBooking.findAll({
        where: {
          busId,
          status: { [Op.in]: ['confirmed', 'pending'] },
        },
        attributes: ['seatNumbers'],
        transaction: t,
      });

      const takenSeats = existingBookings.flatMap((b) => b.seatNumbers);
      const conflict = seatNumbers.find((s) => takenSeats.includes(s));
      if (conflict) {
        throw AppError.conflict(`Seat ${conflict} is already booked. Please choose different seats.`);
      }

      const totalAmount = parseFloat((bus.price * seatNumbers.length).toFixed(2));

      // Debit wallet if payment method is wallet
      const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
      if (paymentMethod === 'wallet') {
        if (!wallet) throw AppError.badRequest('Wallet not found. Please add funds first.');
        if (!wallet.hasSufficientBalance(totalAmount)) {
          throw AppError.badRequest(
            `Insufficient wallet balance. Required: $${totalAmount}, Available: $${wallet.balance}`
          );
        }
        const balanceBefore = parseFloat(wallet.balance);
        await wallet.debit(totalAmount, t);

        await Transaction.create({
          userId,
          walletId:      wallet.id,
          type:          'debit',
          amount:        totalAmount,
          balanceBefore,
          balanceAfter:  parseFloat(wallet.balance),
          category:      'bus_booking',
          description:   `Bus booking — ${bus.source} to ${bus.destination}`,
          status:        'success',
        }, { transaction: t });
      }

      // Create booking
      const booking = await BusBooking.create({
        userId,
        busId,
        seatNumbers,
        passengerName,
        passengerPhone,
        passengerEmail: passengerEmail || null,
        boardingPoint:  boardingPoint  || null,
        droppingPoint:  droppingPoint  || null,
        totalAmount,
        status:         'confirmed',
        paymentStatus:  paymentMethod === 'wallet' ? 'paid' : 'pending',
        paymentMethod:  paymentMethod || 'wallet',
      }, { transaction: t });

      // Increment booked seats on bus
      await bus.update(
        { bookedSeats: bus.bookedSeats + seatNumbers.length },
        { transaction: t }
      );

      // Notification
      await Notification.create({
        userId,
        title:         '🚌 Bus Booking Confirmed!',
        message:       `Seats ${seatNumbers.join(', ')} confirmed on ${bus.name}. Ref: ${booking.bookingRef}`,
        type:          'booking',
        referenceId:   booking.id,
        referenceType: 'bus_booking',
      }, { transaction: t });

      await t.commit();

      return this.getBookingById(booking.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel a bus booking
   */
  async cancelBusBooking(userId, bookingId) {
    const t = await sequelize.transaction();
    try {
      const booking = await BusBooking.findOne({
        where: { id: bookingId, userId },
        include: [{ model: Bus, as: 'bus' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!booking) throw AppError.notFound('Bus booking');
      if (booking.status === 'cancelled') throw AppError.conflict('Booking is already cancelled');

      // Check if cancellation is allowed (before departure)
      const now = new Date();
      const departure = new Date(booking.bus.departureTime);
      if (now >= departure) {
        throw AppError.badRequest('Cannot cancel a booking after departure time');
      }

      await booking.update({
        status:      'cancelled',
        cancelledAt: now,
      }, { transaction: t });

      // Restore seats
      await Bus.update(
        { bookedSeats: sequelize.literal(`bookedSeats - ${booking.seatNumbers.length}`) },
        { where: { id: booking.busId }, transaction: t }
      );

      // Refund to wallet if paid
      if (booking.paymentStatus === 'paid') {
        const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
        if (wallet) {
          const balanceBefore = parseFloat(wallet.balance);
          await wallet.credit(booking.totalAmount, t);

          await Transaction.create({
            userId,
            walletId:      wallet.id,
            type:          'credit',
            amount:        booking.totalAmount,
            balanceBefore,
            balanceAfter:  parseFloat(wallet.balance),
            category:      'bus_refund',
            description:   `Bus booking refund — Ref: ${booking.bookingRef}`,
            reference:     booking.bookingRef,
            referenceType: 'bus_booking',
            status:        'success',
          }, { transaction: t });

          await booking.update({ paymentStatus: 'refunded', refundAmount: booking.totalAmount }, { transaction: t });
        }
      }

      await Notification.create({
        userId,
        title:   '❌ Bus Booking Cancelled',
        message: `Booking ${booking.bookingRef} cancelled. Refund of $${booking.totalAmount} initiated.`,
        type:    'booking',
      }, { transaction: t });

      await t.commit();
      return this.getBookingById(booking.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get user's bus bookings
   */
  async getUserBookings(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { rows, count } = await BusBooking.findAndCountAll({
      where: { userId },
      include: [{ model: Bus, as: 'bus' }],
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit, 10),
      offset,
    });
    return { rows, count };
  }

  /**
   * Get a single booking by ID
   */
  async getBookingById(bookingId) {
    const booking = await BusBooking.findByPk(bookingId, {
      include: [
        { model: Bus,  as: 'bus' },
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
      ],
    });
    if (!booking) throw AppError.notFound('Bus booking');
    return booking;
  }
}

module.exports = new BusService();
