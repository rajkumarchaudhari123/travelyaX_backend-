'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('drivers', {
      id: { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: false,
        unique: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      licenseNumber:   { type: Sequelize.STRING(50),  allowNull: false, unique: true },
      vehicleType:     { type: Sequelize.ENUM('Sedan','SUV','Hatchback','Van','Motorcycle'), allowNull: false },
      vehicleNumber:   { type: Sequelize.STRING(30),  allowNull: false, unique: true },
      vehicleModel:    { type: Sequelize.STRING(100), allowNull: false },
      vehicleColor:    { type: Sequelize.STRING(30),  allowNull: true,  defaultValue: null },
      vehicleYear:     { type: Sequelize.INTEGER,     allowNull: true,  defaultValue: null },
      status:          { type: Sequelize.ENUM('pending','approved','rejected','suspended'), allowNull: false, defaultValue: 'pending' },
      isOnline:        { type: Sequelize.BOOLEAN,     allowNull: false, defaultValue: false },
      rating:          { type: Sequelize.DECIMAL(3,2),allowNull: false, defaultValue: 5.0 },
      totalTrips:      { type: Sequelize.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      totalEarnings:   { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.0 },
      rejectionReason: { type: Sequelize.TEXT,        allowNull: true,  defaultValue: null },
      approvedAt:      { type: Sequelize.DATE,        allowNull: true,  defaultValue: null },
      createdAt:       { type: Sequelize.DATE,        allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:       { type: Sequelize.DATE,        allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('drivers', ['status']);
    await queryInterface.addIndex('drivers', ['isOnline']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('drivers');
  },
};
