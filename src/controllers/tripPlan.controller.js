'use strict';
const { TripPlan, BusinessProfile, User } = require('../models');

exports.createTripPlan = async (req, res) => {
  try {
    const plan = await TripPlan.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, message: 'Trip plan created', data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyTripPlans = async (req, res) => {
  try {
    const plans = await TripPlan.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPublicTripPlans = async (req, res) => {
  try {
    const plans = await TripPlan.findAll({
      where: { isPublic: true, status: 'published' },
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'avatar'] },
        { model: BusinessProfile, as: 'business', attributes: ['id', 'businessName', 'businessType', 'businessLogo', 'city', 'rating'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTripPlanById = async (req, res) => {
  try {
    const plan = await TripPlan.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'avatar'] },
        { model: BusinessProfile, as: 'business' },
      ],
    });
    if (!plan) return res.status(404).json({ success: false, message: 'Trip plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateTripPlan = async (req, res) => {
  try {
    const plan = await TripPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    await plan.update(req.body);
    res.json({ success: true, message: 'Trip plan updated', data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteTripPlan = async (req, res) => {
  try {
    const plan = await TripPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Not found' });
    await plan.destroy();
    res.json({ success: true, message: 'Trip plan deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get all trip plans
exports.getAllTripPlans = async (req, res) => {
  try {
    const plans = await TripPlan.findAll({
      include: [
        { model: User, as: 'user', attributes: ['id', 'fullName', 'email'] },
        { model: BusinessProfile, as: 'business', attributes: ['id', 'businessName', 'businessType'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
