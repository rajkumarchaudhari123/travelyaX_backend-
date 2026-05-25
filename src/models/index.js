'use strict';

const { sequelize } = require('../config/db');

// ─── Import All Models ────────────────────────────────────────────────────────
const User        = require('./User');
const Driver      = require('./Driver');
const Ride        = require('./Ride');
const Bus         = require('./Bus');
const BusBooking  = require('./BusBooking');
const Hotel       = require('./Hotel');
const HotelBooking = require('./HotelBooking');
const Wallet      = require('./Wallet');
const Transaction = require('./Transaction');
const Notification = require('./Notification');
const DriverDocument = require('./DriverDocument');
const BusinessProfile = require('./BusinessProfile');
const TripPlan = require('./TripPlan');

// ─── Associations ─────────────────────────────────────────────────────────────

// User ↔ Driver (one-to-one)
User.hasOne(Driver, { foreignKey: 'userId', as: 'driverProfile', onDelete: 'CASCADE' });
Driver.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Rides (as rider)
User.hasMany(Ride, { foreignKey: 'riderId', as: 'ridesAsRider', onDelete: 'CASCADE' });
Ride.belongsTo(User, { foreignKey: 'riderId', as: 'rider' });

// User ↔ Rides (as driver)
User.hasMany(Ride, { foreignKey: 'driverId', as: 'ridesAsDriver', onDelete: 'SET NULL' });
Ride.belongsTo(User, { foreignKey: 'driverId', as: 'driver' });

// User ↔ BusBookings
User.hasMany(BusBooking, { foreignKey: 'userId', as: 'busBookings', onDelete: 'CASCADE' });
BusBooking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Bus ↔ BusBookings
Bus.hasMany(BusBooking, { foreignKey: 'busId', as: 'bookings', onDelete: 'CASCADE' });
BusBooking.belongsTo(Bus, { foreignKey: 'busId', as: 'bus' });

// User ↔ HotelBookings
User.hasMany(HotelBooking, { foreignKey: 'userId', as: 'hotelBookings', onDelete: 'CASCADE' });
HotelBooking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Hotel ↔ HotelBookings
Hotel.hasMany(HotelBooking, { foreignKey: 'hotelId', as: 'bookings', onDelete: 'CASCADE' });
HotelBooking.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });

// User ↔ Wallet (one-to-one)
User.hasOne(Wallet, { foreignKey: 'userId', as: 'wallet', onDelete: 'CASCADE' });
Wallet.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Transactions
User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions', onDelete: 'CASCADE' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Driver ↔ DriverDocuments
Driver.hasMany(DriverDocument, { foreignKey: 'driverId', as: 'documents', onDelete: 'CASCADE' });
DriverDocument.belongsTo(Driver, { foreignKey: 'driverId', as: 'driver' });

// User ↔ BusinessProfile
User.hasOne(BusinessProfile, { foreignKey: 'userId', as: 'businessProfile', onDelete: 'CASCADE' });
BusinessProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User ↔ TripPlans
User.hasMany(TripPlan, { foreignKey: 'userId', as: 'tripPlans', onDelete: 'CASCADE' });
TripPlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// BusinessProfile ↔ TripPlans
BusinessProfile.hasMany(TripPlan, { foreignKey: 'businessId', as: 'tripPlans', onDelete: 'SET NULL' });
TripPlan.belongsTo(BusinessProfile, { foreignKey: 'businessId', as: 'business' });

// ─── Export ───────────────────────────────────────────────────────────────────
module.exports = {
  sequelize,
  User,
  Driver,
  Ride,
  Bus,
  BusBooking,
  Hotel,
  HotelBooking,
  Wallet,
  Transaction,
  Notification,
  DriverDocument,
  BusinessProfile,
  TripPlan,
};
