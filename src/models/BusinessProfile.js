'use strict';
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BusinessProfile = sequelize.define('BusinessProfile', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true, references: { model: 'users', key: 'id' } },
  // Basic Info
  businessName: { type: DataTypes.STRING, allowNull: false },
  ownerName: { type: DataTypes.STRING, allowNull: false },
  businessType: { type: DataTypes.ENUM('hotel', 'cab_service', 'tour_guide', 'travel_agency', 'adventure_provider'), allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  whatsappNumber: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, allowNull: false },
  website: { type: DataTypes.STRING },
  // Address
  country: { type: DataTypes.STRING, defaultValue: 'India' },
  state: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  fullAddress: { type: DataTypes.TEXT },
  pincode: { type: DataTypes.STRING },
  mapLocation: { type: DataTypes.STRING },
  // Images
  businessLogo: { type: DataTypes.STRING },
  ownerPhoto: { type: DataTypes.STRING },
  coverBanner: { type: DataTypes.STRING },
  businessPhotos: { type: DataTypes.JSON, defaultValue: [] },
  // Identity
  aadhaarCard: { type: DataTypes.STRING },
  panCard: { type: DataTypes.STRING },
  selfieUri: { type: DataTypes.STRING },
  gstCertificate: { type: DataTypes.STRING },
  tradeLicense: { type: DataTypes.STRING },
  businessRegCertificate: { type: DataTypes.STRING },
  // Cab-specific docs
  rcDocument: { type: DataTypes.STRING },
  insuranceDoc: { type: DataTypes.STRING },
  drivingLicense: { type: DataTypes.STRING },
  pollutionCertificate: { type: DataTypes.STRING },
  // Service details (JSON for flexibility per business type)
  serviceDetails: { type: DataTypes.JSON, defaultValue: {} },
  // Bank
  accountHolderName: { type: DataTypes.STRING },
  bankName: { type: DataTypes.STRING },
  accountNumber: { type: DataTypes.STRING },
  ifscCode: { type: DataTypes.STRING },
  upiId: { type: DataTypes.STRING },
  // Availability
  availableDays: { type: DataTypes.JSON, defaultValue: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] },
  openingTime: { type: DataTypes.STRING },
  closingTime: { type: DataTypes.STRING },
  seasonalAvailability: { type: DataTypes.STRING },
  // Status
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'), defaultValue: 'pending' },
  isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'BusinessProfiles', timestamps: true });

module.exports = BusinessProfile;
