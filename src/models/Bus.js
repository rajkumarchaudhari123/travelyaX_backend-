'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Bus extends Model {
  get availableSeats() {
    return this.totalSeats - this.bookedSeats;
  }
}

Bus.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: 'Bus name cannot be empty' } },
    },
    busNumber: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: { name: 'buses_number_unique', msg: 'Bus number already exists' },
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    destination: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    departureTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    arrivalTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'Price cannot be negative' } },
    },
    totalSeats: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 40,
    },
    bookedSeats: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    busType: {
      type: DataTypes.ENUM('AC', 'Non-AC', 'Sleeper', 'Volvo', 'Luxury'),
      allowNull: false,
      defaultValue: 'AC',
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 4.0,
      validate: { min: 0, max: 5 },
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of amenity strings e.g. ["WiFi","AC","USB Charging"]',
    },
    boardingPoints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    droppingPoints: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    travelDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Bus',
    tableName: 'buses',
    timestamps: true,
    indexes: [
      { fields: ['source', 'destination'] },
      { fields: ['travelDate'] },
      { fields: ['isActive'] },
      { fields: ['busType'] },
    ],
  }
);

module.exports = Bus;
