'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Wallets
    await queryInterface.createTable('wallets', {
      id:                 { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      balance:            { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.0 },
      currency:           { type: Sequelize.STRING(5),     allowNull: false, defaultValue: 'USD' },
      totalCredits:       { type: Sequelize.DECIMAL(14,2), allowNull: false, defaultValue: 0.0 },
      totalDebits:        { type: Sequelize.DECIMAL(14,2), allowNull: false, defaultValue: 0.0 },
      isActive:           { type: Sequelize.BOOLEAN,       allowNull: false, defaultValue: true },
      lastTransactionAt:  { type: Sequelize.DATE,          allowNull: true,  defaultValue: null },
      createdAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updatedAt:          { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('wallets', ['userId'], { unique: true });

    // Transactions
    await queryInterface.createTable('transactions', {
      id:                   { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      walletId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null,
        references: { model: 'wallets', key: 'id' }, onDelete: 'SET NULL', onUpdate: 'CASCADE',
      },
      type:                 { type: Sequelize.ENUM('credit','debit'), allowNull: false },
      amount:               { type: Sequelize.DECIMAL(12,2), allowNull: false },
      balanceBefore:        { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.0 },
      balanceAfter:         { type: Sequelize.DECIMAL(12,2), allowNull: false, defaultValue: 0.0 },
      currency:             { type: Sequelize.STRING(5),     allowNull: false, defaultValue: 'USD' },
      category:             {
        type: Sequelize.ENUM(
          'ride_payment','ride_refund','bus_booking','bus_refund',
          'hotel_booking','hotel_refund','wallet_topup','wallet_withdrawal',
          'driver_earning','bonus','penalty','other'
        ), allowNull: false, defaultValue: 'other',
      },
      description:          { type: Sequelize.STRING(255), allowNull: false },
      reference:            { type: Sequelize.STRING(50),  allowNull: true,  defaultValue: null },
      referenceType:        { type: Sequelize.ENUM('ride','bus_booking','hotel_booking','wallet','other'), allowNull: true, defaultValue: null },
      status:               { type: Sequelize.ENUM('pending','success','failed','reversed'), allowNull: false, defaultValue: 'success' },
      paymentGatewayRef:    { type: Sequelize.STRING(100), allowNull: true,  defaultValue: null },
      metadata:             { type: Sequelize.JSON,        allowNull: true,  defaultValue: null },
      createdAt:            { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('transactions', ['userId']);
    await queryInterface.addIndex('transactions', ['type']);
    await queryInterface.addIndex('transactions', ['category']);
    await queryInterface.addIndex('transactions', ['status']);
    await queryInterface.addIndex('transactions', ['createdAt']);

    // Notifications
    await queryInterface.createTable('notifications', {
      id:            { type: Sequelize.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
      userId: {
        type: Sequelize.INTEGER.UNSIGNED, allowNull: false,
        references: { model: 'users', key: 'id' }, onDelete: 'CASCADE', onUpdate: 'CASCADE',
      },
      title:         { type: Sequelize.STRING(150), allowNull: false },
      message:       { type: Sequelize.TEXT,        allowNull: false },
      type:          { type: Sequelize.ENUM('ride','booking','payment','promo','system','alert'), allowNull: false, defaultValue: 'system' },
      isRead:        { type: Sequelize.BOOLEAN,     allowNull: false, defaultValue: false },
      readAt:        { type: Sequelize.DATE,        allowNull: true,  defaultValue: null },
      referenceId:   { type: Sequelize.INTEGER.UNSIGNED, allowNull: true, defaultValue: null },
      referenceType: { type: Sequelize.ENUM('ride','bus_booking','hotel_booking','transaction','other'), allowNull: true, defaultValue: null },
      data:          { type: Sequelize.JSON,        allowNull: true,  defaultValue: null },
      imageUrl:      { type: Sequelize.STRING(500), allowNull: true,  defaultValue: null },
      actionUrl:     { type: Sequelize.STRING(500), allowNull: true,  defaultValue: null },
      expiresAt:     { type: Sequelize.DATE,        allowNull: true,  defaultValue: null },
      createdAt:     { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('notifications', ['userId']);
    await queryInterface.addIndex('notifications', ['isRead']);
    await queryInterface.addIndex('notifications', ['type']);
    await queryInterface.addIndex('notifications', ['createdAt']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('transactions');
    await queryInterface.dropTable('wallets');
  },
};
