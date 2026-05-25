'use strict';
const { BusinessProfile, User } = require('../models');

exports.createBusiness = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    if (userId) {
      const existing = await BusinessProfile.findOne({ where: { userId } });
      if (existing) return res.status(400).json({ success: false, message: 'Business profile already exists' });
    }
    const profile = await BusinessProfile.create({ ...req.body, userId });
    res.status(201).json({ success: true, message: 'Business registered', data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public registration (no auth needed)
exports.registerPublic = async (req, res) => {
  try {
    const profile = await BusinessProfile.create({ ...req.body, userId: null });
    res.status(201).json({ success: true, message: 'Business registered successfully', data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyBusiness = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'No business profile found' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateBusiness = async (req, res) => {
  try {
    const profile = await BusinessProfile.findOne({ where: { userId: req.user.id } });
    if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
    await profile.update(req.body);
    res.json({ success: true, message: 'Business updated', data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public: list registered businesses (pending + approved)
exports.getPublicBusinesses = async (req, res) => {
  try {
    const { type, city } = req.query;
    const { Op } = require('sequelize');
    const where = { status: { [Op.in]: ['pending', 'approved'] } };
    if (type) where.businessType = type;
    if (city) where.city = city;
    const businesses = await BusinessProfile.findAll({
      where,
      attributes: ['id', 'businessName', 'ownerName', 'businessType', 'businessLogo', 'coverBanner', 'city', 'state', 'phone', 'email', 'status', 'isVerified'],
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: businesses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get all businesses
exports.getAllBusinesses = async (req, res) => {
  try {
    const businesses = await BusinessProfile.findAll({
      include: [{ model: User, as: 'user', attributes: ['id', 'fullName', 'email', 'phone'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json({ success: true, data: businesses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: approve/reject business
exports.updateBusinessStatus = async (req, res) => {
  try {
    const profile = await BusinessProfile.findByPk(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
    const { status, isVerified } = req.body;
    await profile.update({ status, isVerified: isVerified ?? (status === 'approved') });
    res.json({ success: true, message: `Business ${status}`, data: profile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
