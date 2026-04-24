import express from 'express';
import multer from 'multer';
import { uploadImage, uploadMultipleImages } from '../utils/cloudinary.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

/**
 * POST /api/upload/image
 * Upload a single image
 * Requires authentication
 */
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided',
      });
    }

    const folder = req.body.folder || 'savrleaf';
    const result = await uploadImage(req.file.buffer, {
      folder,
      resource_type: 'image',
    });

    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image',
    });
  }
});

/**
 * POST /api/upload/images
 * Upload multiple images
 * Requires authentication
 */
router.post('/images', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided',
      });
    }

    const folder = req.body.folder || 'savrleaf';
    const files = req.files.map((file) => file.buffer);

    const results = await uploadMultipleImages(files, {
      folder,
      resource_type: 'image',
    });

    const uploadResults = results.map((result) => ({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
    }));

    res.json({
      success: true,
      images: uploadResults,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload images',
    });
  }
});

export default router;

