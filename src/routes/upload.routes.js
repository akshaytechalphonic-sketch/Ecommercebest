const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload.middleware');
const { authenticate } = require('../middleware/auth.middleware');
const { sendSuccess, sendError } = require('../utils/response');
const { AppError } = require('../middleware/error.middleware');

/**
 * Helper to construct accessible URL
 */
const getFileUrl = (req, filename) => {
  const protocol = req.protocol || 'http';
  const host = req.get('host') || 'localhost:5000';
  return `${protocol}://${host}/uploads/products/${filename}`;
};

/**
 * 1. Upload Single Product Image
 * POST /api/v1/upload/image
 */
router.post(
  '/image',
  authenticate,
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            'Image file is too large. Maximum size is 5MB.',
            'FILE_TOO_LARGE',
            [],
            400
          );
        }
        return next(err);
      }
      if (!req.file) {
        return sendError(
          res,
          'No image file provided. Please choose a file to upload.',
          'MISSING_FILE',
          [],
          400
        );
      }
      next();
    });
  },
  (req, res) => {
    const file = req.file;
    const url = getFileUrl(req, file.filename);
    const relativeUrl = `/uploads/products/${file.filename}`;

    return sendSuccess(
      res,
      'Product image uploaded successfully',
      {
        url,
        relativeUrl,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      },
      201
    );
  }
);

/**
 * 2. Upload Multiple Product Images (Up to 5)
 * POST /api/v1/upload/images
 */
router.post(
  '/images',
  authenticate,
  (req, res, next) => {
    upload.array('images', 5)(req, res, (err) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(
            res,
            'One or more files exceed the 5MB size limit.',
            'FILE_TOO_LARGE',
            [],
            400
          );
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return sendError(
            res,
            'Too many files. A maximum of 5 images can be uploaded at once.',
            'TOO_MANY_FILES',
            [],
            400
          );
        }
        return next(err);
      }
      if (!req.files || req.files.length === 0) {
        return sendError(
          res,
          'No image files provided. Please choose at least one image.',
          'MISSING_FILES',
          [],
          400
        );
      }
      next();
    });
  },
  (req, res) => {
    const uploadedFiles = req.files.map((file) => ({
      url: getFileUrl(req, file.filename),
      relativeUrl: `/uploads/products/${file.filename}`,
      filename: file.filename,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    }));

    return sendSuccess(
      res,
      `${uploadedFiles.length} product images uploaded successfully`,
      {
        images: uploadedFiles,
        urls: uploadedFiles.map((f) => f.url),
      },
      201
    );
  }
);

module.exports = router;
