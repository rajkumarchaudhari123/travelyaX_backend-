'use strict';

const walletService = require('../services/wallet.service');
const { sendSuccess, sendPaginated, parsePagination } = require('../utils/response');
const { validate, topUpWalletSchema, withdrawWalletSchema } = require('../utils/validators');

class WalletController {
  /**
   * GET /api/wallet
   * Get wallet balance + info
   */
  async getWallet(req, res, next) {
    try {
      const wallet = await walletService.getWallet(req.userId);
      return sendSuccess(res, wallet, 'Wallet retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/wallet/summary
   * Get wallet + stats + recent transactions
   */
  async getWalletSummary(req, res, next) {
    try {
      const summary = await walletService.getWalletSummary(req.userId);
      return sendSuccess(res, summary, 'Wallet summary retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/transactions
   * Get paginated transaction history
   */
  async getTransactions(req, res, next) {
    try {
      const { page, limit } = parsePagination(req.query);
      const { type, category, status } = req.query;

      const { rows, count } = await walletService.getTransactions(req.userId, {
        page, limit, type, category, status,
      });

      return sendPaginated(res, rows, count, page, limit, 'Transactions retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/wallet/topup
   * Add money to wallet
   */
  async topUp(req, res, next) {
    try {
      const { value, error } = validate(topUpWalletSchema, req.body);
      if (error) return next(error);

      const result = await walletService.topUp(req.userId, value.amount, value.paymentMethod);
      return sendSuccess(res, result, `$${value.amount} added to wallet successfully`);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/wallet/withdraw
   * Withdraw money from wallet
   */
  async withdraw(req, res, next) {
    try {
      const { value, error } = validate(withdrawWalletSchema, req.body);
      if (error) return next(error);

      const result = await walletService.withdraw(req.userId, value.amount, {
        bankAccount: value.bankAccount,
        upiId:       value.upiId,
      });
      return sendSuccess(res, result, `$${value.amount} withdrawal initiated successfully`);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new WalletController();
