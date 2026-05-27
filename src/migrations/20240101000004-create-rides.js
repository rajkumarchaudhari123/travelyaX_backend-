'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rides', {
      id:               { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      riderId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      driverId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null,
        references: { model: 'users', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      pickupLocation:   { type: Sequelize.STRING(255), allowNull: false },
      dropLocation:     { type: Sequelize.STRING(255), allowNull: false },
      pickupLatitude:   { type: Sequelize.DECIMAL(10,8), allowNull: true, defaultValue: null },
      pickupLongitude:  { type: Sequelize.DECIMAL(11,8), allowNull: true, defaultValue: null },
      dropLatitude:     { type: Sequelize.DECIMAL(10,8), allowNull: true, defaultValue: null },
      dropLongitude:    { type: Sequelize.DECIMAL(11,8), allowNull: true, defaultValue: null },
      rideType:         { type: Sequelize.ENUM('economy','premium','suv'), allowNull: false, defaultValue: 'economy' },
      fare:             { type: Sequelize.DECIMAL(10,2), allowNull: true, defaultValue: null },
      distance:         { type: Sequelize.DECIMAL(8,2),  allowNull: true, defaultValue: null },
      duration:         { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
      status:           { type: Sequelize.ENUM('pending','accepted','in_progress','completed','cancelled'), allowNull: false, defaultValue: 'pending' },
      cancellationReason: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      cancelledBy:      { type: Sequelize.ENUM('rider','driver','admin','system'), allowNull: true, defaultValue: null },
      riderRating:      { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue: null },
      driverRating:     { type: Sequelize.SMALLINT.UNSIGNED, allowNull: true, defaultValue: null },
      riderNote:        { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      driverNote:       { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      acceptedAt:       { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      startedAt:        { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      completedAt:      { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      cancelledAt:      { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      createdAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:        { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('rides', ['riderId']);
    await queryInterface.addIndex('rides', ['driverId']);
    await queryInterface.addIndex('rides', ['status']);
    await queryInterface.addIndex('rides', ['createdAt']);
  },
  async down(queryInterface) { await queryInterface.dropTable('rides'); },
};
