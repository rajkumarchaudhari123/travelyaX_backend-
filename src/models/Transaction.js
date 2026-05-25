'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Transaction extends Model {}

Transaction.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    walletId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      references: { model: 'wallets', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: { min: { args: [0.01], msg: 'Amount must be greater than 0' } },
    },
    balanceBefore: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'USD',
    },
    category: {
      type: DataTypes.ENUM(
        'ride_payment', 'ride_refund',
        'bus_booking', 'bus_refund',
        'hotel_booking', 'hotel_refund',
        'wallet_topup', 'wallet_withdrawal',
        'driver_earning', 'bonus', 'penalty', 'other'
      ),
      allowNull: false,
      defaultValue: 'other',
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
      comment: 'External reference ID (ride ID, booking ref, etc.)',
    },
    referenceType: {
      type: DataTypes.ENUM('ride', 'bus_booking', 'hotel_booking', 'wallet', 'other'),
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'reversed'),
      allowNull: false,
      defaultValue: 'success',
    },
    paymentGatewayRef: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: null,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Transaction',
    tableName: 'transactions',
    timestamps: true,
    updatedAt: false, // Transactions are immutable
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['category'] },
      { fields: ['status'] },
      { fields: ['reference'] },
      { fields: ['createdAt'] },
    ],
  }
);

module.exports = Transaction;
