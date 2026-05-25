'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Wallet extends Model {
  /** Check if wallet has sufficient balance */
  hasSufficientBalance(amount) {
    return parseFloat(this.balance) >= parseFloat(amount);
  }

  /** Credit amount to wallet */
  async credit(amount, t = null) {
    const opts = t ? { transaction: t } : {};
    this.balance = parseFloat(this.balance) + parseFloat(amount);
    this.totalCredits = parseFloat(this.totalCredits) + parseFloat(amount);
    this.lastTransactionAt = new Date();
    return this.save(opts);
  }

  /** Debit amount from wallet */
  async debit(amount, t = null) {
    if (!this.hasSufficientBalance(amount)) {
      throw new Error('Insufficient wallet balance');
    }
    const opts = t ? { transaction: t } : {};
    this.balance = parseFloat(this.balance) - parseFloat(amount);
    this.totalDebits = parseFloat(this.totalDebits) + parseFloat(amount);
    this.lastTransactionAt = new Date();
    return this.save(opts);
  }
}

Wallet.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: { name: 'wallets_user_unique', msg: 'Wallet already exists for this user' },
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    balance: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0.0,
      validate: { min: { args: [0], msg: 'Balance cannot be negative' } },
    },
    currency: {
      type: DataTypes.STRING(5),
      allowNull: false,
      defaultValue: 'USD',
    },
    totalCredits: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    totalDebits: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    lastTransactionAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'Wallet',
    tableName: 'wallets',
    timestamps: true,
    indexes: [
      { unique: true, fields: ['userId'] },
    ],
  }
);

module.exports = Wallet;
