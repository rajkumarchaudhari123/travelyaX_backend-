'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Hotel extends Model {}

Hotel.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: { notEmpty: true, len: [2, 150] },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: { notEmpty: true },
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: true },
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    country: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'India',
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
      defaultValue: null,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
      defaultValue: null,
    },
    pricePerNight: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: { args: [0], msg: 'Price cannot be negative' } },
    },
    category: {
      type: DataTypes.ENUM('budget', 'standard', 'deluxe', 'luxury'),
      allowNull: false,
      defaultValue: 'standard',
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      allowNull: false,
      defaultValue: 4.0,
      validate: { min: 0, max: 5 },
    },
    reviewCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
    },
    thumbnail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: null,
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of image URLs',
    },
    amenities: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of amenity strings',
    },
    roomTypes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: 'Array of room type objects with name and price',
    },
    checkInTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '14:00',
    },
    checkOutTime: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '12:00',
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: null,
    },
    contactEmail: {
      type: DataTypes.STRING(150),
      allowNull: true,
      defaultValue: null,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    totalRooms: {
      type: DataTypes.SMALLINT.UNSIGNED,
      allowNull: false,
      defaultValue: 10,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    cancellationPolicy: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Hotel',
    tableName: 'hotels',
    timestamps: true,
    indexes: [
      { fields: ['city'] },
      { fields: ['category'] },
      { fields: ['rating'] },
      { fields: ['isAvailable'] },
      { fields: ['isActive'] },
      { fields: ['pricePerNight'] },
    ],
  }
);

module.exports = Hotel;
