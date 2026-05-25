'use strict';

const router = require('express').Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/',          walletController.getWallet);
router.get('/summary',   walletController.getWalletSummary);
router.post('/topup',    walletController.topUp);
router.post('/withdraw', walletController.withdraw);

module.exports = router;
