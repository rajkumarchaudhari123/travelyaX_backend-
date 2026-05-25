'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const TripPlan = sequelize.define('TripPlan', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, references: { model: 'users', key: 'id' } },
  // Business that created it (optional — null means user-created)
  businessId: { type: DataTypes.UUID, references: { model: 'BusinessProfiles', key: 'id' } },
  title: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  coverImage: { type: DataTypes.STRING },
  images: { type: DataTypes.JSON, defaultValue: [] },
  destinations: { type: DataTypes.JSON, defaultValue: [] },
  startDate: { type: DataTypes.DATEONLY },
  endDate: { type: DataTypes.DATEONLY },
  totalDays: { type: DataTypes.INTEGER },
  travelers: { type: DataTypes.JSON, defaultValue: {} },
  budget: { type: DataTypes.ENUM('budget', 'standard', 'luxury'), defaultValue: 'standard' },
  budgetAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  stayPreferences: { type: DataTypes.JSON, defaultValue: [] },
  transportation: { type: DataTypes.JSON, defaultValue: [] },
  amenities: { type: DataTypes.JSON, defaultValue: [] },
  activities: { type: DataTypes.JSON, defaultValue: [] },
  foodPreferences: { type: DataTypes.JSON, defaultValue: [] },
  // For business-created packages
  pricePerPerson: { type: DataTypes.FLOAT },
  maxGroupSize: { type: DataTypes.INTEGER },
  highlights: { type: DataTypes.JSON, defaultValue: [] },
  inclusions: { type: DataTypes.JSON, defaultValue: [] },
  exclusions: { type: DataTypes.JSON, defaultValue: [] },
  // Status
  status: { type: DataTypes.ENUM('draft', 'published', 'booked', 'completed', 'cancelled'), defaultValue: 'draft' },
  isPublic: { type: DataTypes.BOOLEAN, defaultValue: false },
  rating: { type: DataTypes.FLOAT, defaultValue: 0 },
  bookingCount: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'TripPlans', timestamps: true });

module.exports = TripPlan;
