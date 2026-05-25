'use strict';

const path = require('path');
const { Driver, DriverDocument } = require('../models');
const { sendSuccess, sendCreated } = require('../utils/response');
const { AppError } = require('../utils/AppError');

class UploadController {
  /**
   * POST /api/upload/driver-document
   * Upload a driver verification document
   */
  async uploadDriverDocument(req, res, next) {
    try {
      if (!req.file) {
        return next(AppError.badRequest('No file uploaded'));
      }

      const { documentType } = req.body;
      const validTypes = ['license', 'insurance', 'vehicle_photo', 'id_card', 'other'];

      if (!documentType || !validTypes.includes(documentType)) {
        return next(AppError.badRequest(`documentType must be one of: ${validTypes.join(', ')}`));
      }

      // Get the driver profile for this user
      const driver = await Driver.findOne({ where: { userId: req.userId } });
      if (!driver) {
        return next(AppError.forbidden('Only drivers can upload documents'));
      }

      // Check if a document of this type already exists
      const existing = await DriverDocument.findOne({
        where: { driverId: driver.id, documentType },
      });

      if (existing) {
        // Update existing document record
        await existing.update({
          fileName:     req.file.filename,
          originalName: req.file.originalname,
          filePath:     `uploads/${req.file.filename}`,
          mimeType:     req.file.mimetype,
          fileSize:     req.file.size,
          status:       'pending', // Re-submit for review
          reviewedAt:   null,
          reviewNote:   null,
        });
        return sendSuccess(res, existing, 'Document updated and submitted for review');
      }

      // Create new document record
      const doc = await DriverDocument.create({
        driverId:     driver.id,
        documentType,
        fileName:     req.file.filename,
        originalName: req.file.originalname,
        filePath:     `uploads/${req.file.filename}`,
        mimeType:     req.file.mimetype,
        fileSize:     req.file.size,
        status:       'pending',
      });

      return sendCreated(res, doc, 'Document uploaded successfully and submitted for review');
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/upload/driver-documents
   * Get all documents for authenticated driver
   */
  async getDriverDocuments(req, res, next) {
    try {
      const driver = await Driver.findOne({ where: { userId: req.userId } });
      if (!driver) return next(AppError.forbidden('Driver profile not found'));

      const documents = await DriverDocument.findAll({
        where:  { driverId: driver.id },
        order:  [['createdAt', 'DESC']],
      });

      return sendSuccess(res, documents, 'Documents retrieved successfully');
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/upload/driver-documents/:docId
   * Delete a driver document
   */
  async deleteDriverDocument(req, res, next) {
    try {
      const docId = parseInt(req.params.docId, 10);
      if (!docId) return next(AppError.badRequest('Invalid document ID'));

      const driver = await Driver.findOne({ where: { userId: req.userId } });
      if (!driver) return next(AppError.forbidden('Driver profile not found'));

      const doc = await DriverDocument.findOne({
        where: { id: docId, driverId: driver.id },
      });
      if (!doc) return next(AppError.notFound('Document'));

      // Delete file from disk
      const fs   = require('fs');
      const full = path.join(process.cwd(), doc.filePath);
      if (fs.existsSync(full)) fs.unlinkSync(full);

      await doc.destroy();
      return sendSuccess(res, null, 'Document deleted successfully');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UploadController();
