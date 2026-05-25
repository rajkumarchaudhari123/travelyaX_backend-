'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Driver extends Model {}

Driver.init(
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
    licenseNumber: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: { name: 'drivers_license_unique', msg: 'License number already registered' },
      validate: {
        notEmpty: { msg: 'License number cannot be empty' },
      },
    },
    vehicleType: {
      type: DataTypes.ENUM('Sedan', 'SUV', 'Hatchback', 'Van', 'Motorcycle'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Sedan', 'SUV', 'Hatchback', 'Van', 'Motorcycle']],
          msg: 'Invalid vehicle type',
        },
      },
    },
    vehicleNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'drivers_vehicle_number_unique', msg: 'Vehicle number already registered' },
      validate: {
        notEmpty: { msg: 'Vehicle number cannot be empty' },
      },
    },
    vehicleModel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Vehicle model cannot be empty' },
      },
    },
    vehicleColor: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: null,
    },
    vehicleYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      validate: {
        min: { args: [1990], msg: 'Vehicle year must be 1990 or later' },
        max: { args: [new Date().getFullYear() + 1], msg: 'Invalid vehicle year' },
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
      allowNull: false,
      defaultValue: 'pending',
    },
    isOnline: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 5.0,
      validate: {
        min: 0,
        max: 5,
      },
    },
    totalTrips: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Driver',
    tableName: 'drivers',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['userId'] },
      { unique: true, fields: ['licenseNumber'] },
      { unique: true, fields: ['vehicleNumber'] },
      { fields: ['status'] },
      { fields: ['isOnline'] },
    ],
  }
);

module.exports = Driver;
