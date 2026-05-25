'use strict';

const router = require('express').Router();
const walletController = require('../controllers/wallet.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', walletController.getTransactions);

module.exports = router;
