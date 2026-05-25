'use strict';

const router = require('express').Router();
const uploadController = require('../controllers/upload.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadSingle } = require('../config/multer');

router.use(authenticate);
router.use(authorize('driver'));

router.post(
  '/driver-document',
  uploadSingle('document'),
  uploadController.uploadDriverDocument
);
router.get('/driver-documents',                uploadController.getDriverDocuments);
router.delete('/driver-documents/:docId',      uploadController.deleteDriverDocument);

module.exports = router;
