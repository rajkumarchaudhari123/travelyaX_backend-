'use strict';
const router = require('express').Router();
const ctrl = require('../controllers/tripPlan.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/public', ctrl.getPublicTripPlans);
router.get('/all', authenticate, ctrl.getAllTripPlans);
router.get('/my', authenticate, ctrl.getMyTripPlans);
router.get('/:id', ctrl.getTripPlanById);
router.post('/', authenticate, ctrl.createTripPlan);
router.put('/:id', authenticate, ctrl.updateTripPlan);
router.delete('/:id', authenticate, ctrl.deleteTripPlan);

module.exports = router;
