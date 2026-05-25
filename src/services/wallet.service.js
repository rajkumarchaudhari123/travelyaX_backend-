'use strict';

const { sequelize } = require('../config/db');
const { Wallet, Transaction, User } = require('../models');
const { AppError } = require('../utils/AppError');
const { Op } = require('sequelize');

class WalletService {
  /**
   * Get wallet for a user (create if missing)
   */
  async getOrCreateWallet(userId) {
    let wallet = await Wallet.findOne({ where: { userId } });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0 });
    }
    return wallet;
  }

  /**
   * Get wallet details
   */
  async getWallet(userId) {
    const wallet = await Wallet.findOne({
      where: { userId },
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email'] }],
    });
    if (!wallet) throw AppError.notFound('Wallet');
    return wallet;
  }

  /**
   * Get paginated transaction history
   */
  async getTransactions(userId, { page = 1, limit = 20, type, category, status } = {}) {
    const offset = (page - 1) * limit;
    const where = { userId };

    if (type) where.type = type;
    if (category) where.category = category;
    if (status) where.status = status;

    const { rows, count } = await Transaction.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    return { rows, count };
  }

  /**
   * Top up wallet balance
   */
  async topUp(userId, amount, paymentMethod) {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({
        where: { userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!wallet) throw AppError.notFound('Wallet');
      if (!wallet.isActive) throw AppError.forbidden('Wallet is suspended');

      const balanceBefore = parseFloat(wallet.balance);
      await wallet.credit(amount, t);

      const transaction = await Transaction.create({
        userId,
        walletId: wallet.id,
        type: 'credit',
        amount: parseFloat(amount),
        balanceBefore,
        balanceAfter: parseFloat(wallet.balance),
        category: 'wallet_topup',
        description: `Wallet top-up via ${paymentMethod}`,
        paymentGatewayRef: `PAY_${Date.now()}`,
        status: 'success',
      }, { transaction: t });

      await t.commit();
      return { wallet: await this.getWallet(userId), transaction };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Withdraw from wallet
   */
  async withdraw(userId, amount, { bankAccount, upiId } = {}) {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.findOne({
        where: { userId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!wallet) throw AppError.notFound('Wallet');
      if (!wallet.isActive) throw AppError.forbidden('Wallet is suspended');
      if (!wallet.hasSufficientBalance(amount)) {
        throw AppError.badRequest(
          `Insufficient balance. Available: $${wallet.balance}, Requested: $${amount}`
        );
      }

      const balanceBefore = parseFloat(wallet.balance);
      await wallet.debit(amount, t);

      const transaction = await Transaction.create({
        userId,
        walletId: wallet.id,
        type: 'debit',
        amount: parseFloat(amount),
        balanceBefore,
        balanceAfter: parseFloat(wallet.balance),
        category: 'wallet_withdrawal',
        description: `Wallet withdrawal to ${bankAccount ? 'bank account' : 'UPI'}`,
        status: 'success',
        metadata: { bankAccount: bankAccount || null, upiId: upiId || null },
      }, { transaction: t });

      await t.commit();
      return { wallet: await this.getWallet(userId), transaction };
    } catch (error) {
      await t.rollback();
      throw error;
    }
  }

  /**
   * Get wallet summary stats
   */
  async getWalletSummary(userId) {
    const wallet = await this.getWallet(userId);

    const [creditSum, debitSum, recentTx] = await Promise.all([
      Transaction.sum('amount', { where: { userId, type: 'credit', status: 'success' } }),
      Transaction.sum('amount', { where: { userId, type: 'debit', status: 'success' } }),
      Transaction.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 5,
      }),
    ]);

    return {
      wallet,
      stats: {
        totalCredits: parseFloat(creditSum || 0).toFixed(2),
        totalDebits: parseFloat(debitSum || 0).toFixed(2),
        transactionCount: await Transaction.count({ where: { userId } }),
      },
      recentTransactions: recentTx,
    };
  }
}

module.exports = new WalletService();
