'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Buses table
    await queryInterface.createTable('buses', {
      id:             { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      name:           { type: Sequelize.STRING(100), allowNull: false },
      busNumber:      { type: Sequelize.STRING(30),  allowNull: false, unique: true },
      operatorName:   { type: Sequelize.STRING(100), allowNull: false },
      source:         { type: Sequelize.STRING(100), allowNull: false },
      destination:    { type: Sequelize.STRING(100), allowNull: false },
      departureTime:  { type: Sequelize.DATE,        allowNull: false },
      arrivalTime:    { type: Sequelize.DATE,        allowNull: false },
      price:          { type: Sequelize.DECIMAL(10,2), allowNull: false },
      totalSeats:     { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 40 },
      bookedSeats:    { type: Sequelize.SMALLINT.UNSIGNED, allowNull: false, defaultValue: 0 },
      busType:        { type: Sequelize.ENUM('AC','Non-AC','Sleeper','Volvo','Luxury'), allowNull: false, defaultValue: 'AC' },
      rating:         { type: Sequelize.DECIMAL(3,2), allowNull: false, defaultValue: 4.0 },
      amenities:      { type: Sequelize.JSON, allowNull: true, defaultValue: '[]' },
      boardingPoints: { type: Sequelize.JSON, allowNull: true, defaultValue: '[]' },
      droppingPoints: { type: Sequelize.JSON, allowNull: true, defaultValue: '[]' },
      isActive:       { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      travelDate:     { type: Sequelize.DATEONLY,    allowNull: false },
      createdAt:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:      { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('buses', ['source', 'destination']);
    await queryInterface.addIndex('buses', ['travelDate']);
    await queryInterface.addIndex('buses', ['isActive']);

    // Bus bookings table
    await queryInterface.createTable('bus_bookings', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      busId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'buses', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      seatNumbers:        { type: Sequelize.JSON,        allowNull: false },
      passengerName:      { type: Sequelize.STRING(100), allowNull: false },
      passengerPhone:     { type: Sequelize.STRING(20),  allowNull: false },
      passengerEmail:     { type: Sequelize.STRING(150), allowNull: true,  defaultValue: null },
      boardingPoint:      { type: Sequelize.STRING(200), allowNull: true,  defaultValue: null },
      droppingPoint:      { type: Sequelize.STRING(200), allowNull: true,  defaultValue: null },
      totalAmount:        { type: Sequelize.DECIMAL(10,2), allowNull: false },
      status:             { type: Sequelize.ENUM('pending','confirmed','cancelled','completed'), allowNull: false, defaultValue: 'confirmed' },
      paymentStatus:      { type: Sequelize.ENUM('pending','paid','refunded','failed'), allowNull: false, defaultValue: 'pending' },
      paymentMethod:      { type: Sequelize.ENUM('wallet','card','upi','cash'), allowNull: true, defaultValue: null },
      bookingRef:         { type: Sequelize.STRING(20),  allowNull: false, unique: true },
      cancellationReason: { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      cancelledAt:        { type: Sequelize.DATE,        allowNull: true,  defaultValue: null },
      createdAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('bus_bookings', ['userId']);
    await queryInterface.addIndex('bus_bookings', ['busId']);
    await queryInterface.addIndex('bus_bookings', ['bookingRef'], { unique: true });
    await queryInterface.addIndex('bus_bookings', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bus_bookings');
    await queryInterface.dropTable('buses');
  },
};
