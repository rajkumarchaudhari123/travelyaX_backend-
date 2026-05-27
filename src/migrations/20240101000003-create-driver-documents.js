'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('driver_documents', {
      id:           { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      driverId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'drivers', key: 'id' },
        onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      documentType: { type: Sequelize.ENUM('license','insurance','vehicle_photo','id_card','other'), allowNull: false },
      fileName:     { type: Sequelize.STRING(255), allowNull: false },
      originalName: { type: Sequelize.STRING(255), allowNull: false },
      filePath:     { type: Sequelize.STRING(500), allowNull: false },
      mimeType:     { type: Sequelize.STRING(100), allowNull: false },
      fileSize:     { type: Sequelize.INTEGER.UNSIGNED, allowNull: false },
      status:       { type: Sequelize.ENUM('pending','approved','rejected'), allowNull: false, defaultValue: 'pending' },
      reviewedAt:   { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      reviewNote:   { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      createdAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('driver_documents', ['driverId']);
    await queryInterface.addIndex('driver_documents', ['documentType']);
    await queryInterface.addIndex('driver_documents', ['status']);
  },
  async down(queryInterface) { await queryInterface.dropTable('driver_documents'); },
};
