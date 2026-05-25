'use strict';

const { sequelize } = require('../config/db');
const { Hotel, HotelBooking, Wallet, Transaction, Notification, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { Op } = require('sequelize');

const TAX_RATE = 0.12; // 12% tax

class HotelService {
  /**
   * List hotels with filters
   */
  async getHotels({ city, category, minPrice, maxPrice, rating, page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const where  = { isActive: true };

    if (city)     where.city     = { [Op.like]: `%${city}%` };
    if (category) where.category = category;
    if (rating)   where.rating   = { [Op.gte]: rating };

    if (minPrice || maxPrice) {
      where.pricePerNight = {};
      if (minPrice) where.pricePerNight[Op.gte] = minPrice;
      if (maxPrice) where.pricePerNight[Op.lte] = maxPrice;
    }

    const { rows, count } = await Hotel.findAndCountAll({
      where,
      order: [
        ['rating', 'DESC'],
        ['pricePerNight', 'ASC'],
      ],
      limit:  parseInt(limit, 10),
      offset,
    });

    return { rows, count };
  }

  /**
   * Get a single hotel
   */
  async getHotelById(hotelId) {
    const hotel = await Hotel.findOne({ where: { id: hotelId, isActive: true } });
    if (!hotel) throw AppError.notFound('Hotel');
    return hotel;
  }

  /**
   * Book a hotel
   */
  async bookHotel(userId, data) {
    const t = await sequelize.transaction();
    try {
      const {
        hotelId, checkIn, checkOut, guests, rooms, roomType,
        guestName, guestPhone, guestEmail, paymentMethod, specialRequests,
      } = data;

      const hotel = await Hotel.findOne({
        where: { id: hotelId, isActive: true, isAvailable: true },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!hotel) throw AppError.notFound('Hotel or hotel is currently unavailable');

      // Calculate nights
      const checkInDate  = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));

      const subtotal     = parseFloat((hotel.pricePerNight * rooms * nights).toFixed(2));
      const taxAmount    = parseFloat((subtotal * TAX_RATE).toFixed(2));
      const totalAmount  = parseFloat((subtotal + taxAmount).toFixed(2));

      // Wallet payment
      if (paymentMethod === 'wallet') {
        const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
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
          category:      'hotel_booking',
          description:   `Hotel booking — ${hotel.name}, ${nights} night(s)`,
          status:        'success',
        }, { transaction: t });
      }

      // Create booking
      const booking = await HotelBooking.create({
        userId,
        hotelId,
        checkIn:        checkInDate.toISOString().split('T')[0],
        checkOut:       checkOutDate.toISOString().split('T')[0],
        guests:         guests  || 1,
        rooms:          rooms   || 1,
        roomType:       roomType || 'standard',
        guestName,
        guestPhone,
        guestEmail:     guestEmail || null,
        pricePerNight:  hotel.pricePerNight,
        totalNights:    nights,
        totalAmount,
        taxAmount,
        status:         'confirmed',
        paymentStatus:  paymentMethod === 'wallet' ? 'paid' : 'pending',
        paymentMethod:  paymentMethod || 'wallet',
        specialRequests: specialRequests || null,
      }, { transaction: t });

      // Update hotel review count (for demo; real implementation would track separately)
      await hotel.update(
        { reviewCount: sequelize.literal('reviewCount + 1') },
        { transaction: t }
      );

      await Notification.create({
        userId,
        title:         '🏨 Hotel Booking Confirmed!',
        message:       `${hotel.name} booked for ${nights} night(s). Check-in: ${checkIn}. Ref: ${booking.bookingRef}`,
        type:          'booking',
        referenceId:   booking.id,
        referenceType: 'hotel_booking',
      }, { transaction: t });

      await t.commit();
      return this.getBookingById(booking.id);
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Cancel hotel booking
   */
  async cancelHotelBooking(userId, bookingId) {
    const t = await sequelize.transaction();
    try {
      const booking = await HotelBooking.findOne({
        where: { id: bookingId, userId },
        include: [{ model: Hotel, as: 'hotel' }],
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!booking) throw AppError.notFound('Hotel booking');
      if (booking.status === 'cancelled') throw AppError.conflict('Booking is already cancelled');

      const checkIn = new Date(booking.checkIn);
      const now     = new Date();
      const hoursUntilCheckIn = (checkIn - now) / (1000 * 60 * 60);

      // Refund policy: full refund if >24h before check-in
      let refundAmount = 0;
      if (hoursUntilCheckIn > 24) {
        refundAmount = parseFloat(booking.totalAmount);
      } else if (hoursUntilCheckIn > 0) {
        refundAmount = parseFloat((booking.totalAmount * 0.5).toFixed(2)); // 50% refund
      }

      await booking.update({
        status:        'cancelled',
        cancelledAt:   now,
        refundAmount,
      }, { transaction: t });

      if (refundAmount > 0 && booking.paymentStatus === 'paid') {
        const wallet = await Wallet.findOne({ where: { userId }, transaction: t, lock: t.LOCK.UPDATE });
        if (wallet) {
          const balanceBefore = parseFloat(wallet.balance);
          await wallet.credit(refundAmount, t);

          await Transaction.create({
            userId,
            walletId:      wallet.id,
            type:          'credit',
            amount:        refundAmount,
            balanceBefore,
            balanceAfter:  parseFloat(wallet.balance),
            category:      'hotel_refund',
            description:   `Hotel refund — ${booking.hotel.name}. Ref: ${booking.bookingRef}`,
            reference:     booking.bookingRef,
            referenceType: 'hotel_booking',
            status:        'success',
          }, { transaction: t });

          await booking.update({ paymentStatus: 'refunded' }, { transaction: t });
        }
      }

      await Notification.create({
        userId,
        title:   '❌ Hotel Booking Cancelled',
        message: refundAmount > 0
          ? `Booking ${booking.bookingRef} cancelled. Refund of $${refundAmount} processed.`
          : `Booking ${booking.bookingRef} cancelled. No refund applicable.`,
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
   * Get user's hotel bookings
   */
  async getUserBookings(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { rows, count } = await HotelBooking.findAndCountAll({
      where: { userId },
      include: [{ model: Hotel, as: 'hotel' }],
      order:  [['createdAt', 'DESC']],
      limit:  parseInt(limit, 10),
      offset,
    });
    return { rows, count };
  }

  /**
   * Get a single hotel booking
   */
  async getBookingById(bookingId) {
    const booking = await HotelBooking.findByPk(bookingId, {
      include: [
        { model: Hotel, as: 'hotel' },
        { model: User,  as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] },
      ],
    });
    if (!booking) throw AppError.notFound('Hotel booking');
    return booking;
  }
}

module.exports = new HotelService();
