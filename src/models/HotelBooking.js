'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class HotelBooking extends Model {
  /** Calculate number of nights */
  get nights() {
    if (!this.checkIn || !this.checkOut) return 0;
    const diff = new Date(this.checkOut) - new Date(this.checkIn);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }
}

HotelBooking.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    hotelId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'hotels', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    checkIn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    checkOut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isAfterCheckIn(value) {
          if (new Date(value) <= new Date(this.checkIn)) {
            throw new Error('Check-out date must be after check-in date');
          }
        },
      },
    },
    guests: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 20 },
    },
    rooms: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 10 },
    },
    roomType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'standard',
    },
    guestName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    guestPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    guestEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: null,
    },
    pricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    totalNights: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed', 'partially_refunded'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentMethod: {
      type: DataTypes.ENUM('wallet', 'card', 'upi', 'cash'),
      allowNull: true,
      defaultValue: null,
    },
    bookingRef: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    specialRequests: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'HotelBooking',
    tableName: 'hotel_bookings',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['hotelId'] },
      { unique: true, fields: ['bookingRef'] },
      { fields: ['status'] },
      { fields: ['checkIn', 'checkOut'] },
      { fields: ['paymentStatus'] },
    ],
    hooks: {
      beforeCreate: (booking) => {
        if (!booking.bookingRef) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          booking.bookingRef = `HTL${timestamp}${random}`;
        }
      },
    },
  }
);

module.exports = HotelBooking;
