'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class BusBooking extends Model {}

BusBooking.init(
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
    busId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'buses', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    seatNumbers: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Array of seat numbers booked e.g. [3, 4]',
    },
    passengerName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    passengerPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    passengerEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: null,
    },
    boardingPoint: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    droppingPoint: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: null,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'cancelled', 'completed'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'paid', 'refunded', 'failed'),
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
  },
  {
    sequelize,
    modelName: 'BusBooking',
    tableName: 'bus_bookings',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['busId'] },
      { unique: true, fields: ['bookingRef'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
    ],
    hooks: {
      beforeCreate: (booking) => {
        if (!booking.bookingRef) {
          const timestamp = Date.now().toString(36).toUpperCase();
          const random = Math.random().toString(36).substring(2, 6).toUpperCase();
          booking.bookingRef = `BUS${timestamp}${random}`;
        }
      },
    },
  }
);

module.exports = BusBooking;
