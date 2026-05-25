'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('hotels', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:               { type: Sequelize.STRING(150), allowNull: false },
      description:        { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      location:           { type: Sequelize.STRING(255), allowNull: false },
      city:               { type: Sequelize.STRING(100), allowNull: false },
      state:              { type: Sequelize.STRING(100), allowNull: true,  defaultValue: null },
      country:            { type: Sequelize.STRING(100), allowNull: false, defaultValue: 'India' },
      latitude:           { type: Sequelize.DECIMAL(10,8), allowNull: true, defaultValue: null },
      longitude:          { type: Sequelize.DECIMAL(11,8), allowNull: true, defaultValue: null },
      pricePerNight:      { type: Sequelize.DECIMAL(10,2), allowNull: false },
      category:           { type: Sequelize.ENUM('budget','standard','deluxe','luxury'), allowNull: false, defaultValue: 'standard' },
      rating:             { type: Sequelize.DECIMAL(3,2),  allowNull: false, defaultValue: 4.0 },
      reviewCount:        { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      thumbnail:          { type: Sequelize.STRING(500), allowNull: true,  defaultValue: null },
      images:             { type: Sequelize.JSON,        allowNull: true,  defaultValue: '[]' },
      amenities:          { type: Sequelize.JSON,        allowNull: true,  defaultValue: '[]' },
      roomTypes:          { type: Sequelize.JSON,        allowNull: true,  defaultValue: '[]' },
      checkInTime:        { type: Sequelize.STRING(10),  allowNull: false, defaultValue: '14:00' },
      checkOutTime:       { type: Sequelize.STRING(10),  allowNull: false, defaultValue: '12:00' },
      contactPhone:       { type: Sequelize.STRING(20),  allowNull: true,  defaultValue: null },
      contactEmail:       { type: Sequelize.STRING(150), allowNull: true,  defaultValue: null },
      isAvailable:        { type: Sequelize.BOOLEAN,     allowNull: false, defaultValue: true },
      totalRooms:         { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 10 },
      isActive:           { type: Sequelize.BOOLEAN,     allowNull: false, defaultValue: true },
      cancellationPolicy: { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      createdAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('hotels', ['city']);
    await queryInterface.addIndex('hotels', ['category']);
    await queryInterface.addIndex('hotels', ['rating']);
    await queryInterface.addIndex('hotels', ['isActive']);

    await queryInterface.createTable('hotel_bookings', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      hotelId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'hotels', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      checkIn:            { type: Sequelize.DATEONLY,    allowNull: false },
      checkOut:           { type: Sequelize.DATEONLY,    allowNull: false },
      guests:             { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      rooms:              { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      roomType:           { type: Sequelize.STRING(50),  allowNull: false, defaultValue: 'standard' },
      guestName:          { type: Sequelize.STRING(100), allowNull: false },
      guestPhone:         { type: Sequelize.STRING(20),  allowNull: false },
      guestEmail:         { type: Sequelize.STRING(150), allowNull: true,  defaultValue: null },
      pricePerNight:      { type: Sequelize.DECIMAL(10,2), allowNull: false },
      totalNights:        { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
      totalAmount:        { type: Sequelize.DECIMAL(12,2), allowNull: false },
      taxAmount:          { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      discountAmount:     { type: Sequelize.DECIMAL(10,2), allowNull: false, defaultValue: 0 },
      status:             { type: Sequelize.ENUM('pending','confirmed','checked_in','checked_out','cancelled','no_show'), allowNull: false, defaultValue: 'confirmed' },
      paymentStatus:      { type: Sequelize.ENUM('pending','paid','refunded','failed','partially_refunded'), allowNull: false, defaultValue: 'pending' },
      paymentMethod:      { type: Sequelize.ENUM('wallet','card','upi','cash'), allowNull: true, defaultValue: null },
      bookingRef:         { type: Sequelize.STRING(20),  allowNull: false, unique: true },
      specialRequests:    { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      cancellationReason: { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      cancelledAt:        { type: Sequelize.DATE,        allowNull: true,  defaultValue: null },
      refundAmount:       { type: Sequelize.DECIMAL(10,2), allowNull: true, defaultValue: null },
      createdAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('hotel_bookings', ['userId']);
    await queryInterface.addIndex('hotel_bookings', ['hotelId']);
    await queryInterface.addIndex('hotel_bookings', ['bookingRef'], { unique: true });
    await queryInterface.addIndex('hotel_bookings', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('hotel_bookings');
    await queryInterface.dropTable('hotels');
  },
};
