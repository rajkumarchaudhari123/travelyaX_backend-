'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Ride extends Model {
  /** Check if ride can be cancelled */
  isCancellable() {
    return ['pending', 'accepted'].includes(this.status);
  }

  /** Check if ride is active */
  isActive() {
    return ['pending', 'accepted', 'in_progress'].includes(this.status);
  }

  /** Check if OTP has been verified */
  isOtpVerified() {
    return !!this.otpVerifiedAt;
  }
}

Ride.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    riderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    driverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    pickupLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Pickup location cannot be empty' },
      },
    },
    dropLocation: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Drop location cannot be empty' },
      },
    },
    pickupLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    pickupLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    dropLatitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    dropLongitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    rideType: {
      type: DataTypes.ENUM('mini', 'economy', 'premium', 'suv', 'electric'),
      allowNull: false,
      defaultValue: 'economy',
    },
    fare: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
      validate: {
        min: { args: [0], msg: 'Fare cannot be negative' },
      },
    },
    distance: {
      type: DataTypes.DECIMAL(8, 2),
      allowNull: true,
      defaultValue: null,
      comment: 'Distance in km',
    },
    duration: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: 'Duration in minutes',
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    cancellationReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    cancelledBy: {
      type: DataTypes.ENUM('rider', 'driver', 'admin', 'system'),
      allowNull: true,
      defaultValue: null,
    },
    riderRating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      validate: { min: 1, max: 5 },
    },
    driverRating: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      validate: { min: 1, max: 5 },
    },
    riderNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    driverNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    acceptedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    startedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    otp: {
      type: DataTypes.STRING(4),
      allowNull: true,
      defaultValue: null,
      comment: '4-digit OTP for ride verification',
    },
    otpVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: 'Timestamp when OTP was verified by driver',
    },
  },
  {
    sequelize,
    modelName: 'Ride',
    tableName: 'rides',
    timestamps: true,
    indexes: [
      { fields: ['riderId'] },
      { fields: ['driverId'] },
      { fields: ['status'] },
      { fields: ['rideType'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Ride;
