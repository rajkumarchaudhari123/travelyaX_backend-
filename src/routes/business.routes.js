'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/business.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/public', ctrl.getPublicBusinesses);
router.post('/register', ctrl.registerPublic);
router.get('/all', authenticate, ctrl.getAllBusinesses);
router.get('/my', authenticate, ctrl.getMyBusiness);
router.post('/', authenticate, ctrl.createBusiness);
router.put('/', authenticate, ctrl.updateBusiness);
router.put('/:id/status', authenticate, ctrl.updateBusinessStatus);

module.exports = router;
