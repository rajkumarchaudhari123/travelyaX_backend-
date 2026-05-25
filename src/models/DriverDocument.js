'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class DriverDocument extends Model {}

DriverDocument.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    driverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'drivers', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    documentType: {
      type: DataTypes.ENUM('license', 'insurance', 'vehicle_photo', 'id_card', 'other'),
      allowNull: false,
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    originalName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    filePath: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    reviewNote: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'DriverDocument',
    tableName: 'driver_documents',
    timestamps: true,
    indexes: [
      { fields: ['driverId'] },
      { fields: ['documentType'] },
      { fields: ['status'] },
    ],
  }
);

module.exports = DriverDocument;
