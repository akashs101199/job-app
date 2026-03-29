const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateFileType, validateFileSize } = require('../services/ai/resumeParser.service');

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '5242880'); // 5MB default
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads/resumes';

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = req.user?.email?.replace(/[^a-zA-Z0-9]/g, '_') || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `resume_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// File filter to validate file type and size
const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!validateFileType(file.mimetype)) {
    return cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only PDF and DOCX files are allowed.`
      ),
      false
    );
  }

  // Validate file size will be checked after upload
  cb(null, true);
};

// Create multer uploader with configuration
const uploader = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Middleware to handle resume file uploads
 * Validates file type and size
 * Attaches file information to request
 */
const uploadResume = uploader.single('file');

/**
 * Wrapper middleware to provide better error handling
 */
const uploadMiddleware = (req, res, next) => {
  uploadResume(req, res, (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'FILE_TOO_LARGE') {
        return res.status(400).json({
          error: 'File too large',
          message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: 'Too many files',
          message: 'Only one file can be uploaded at a time',
        });
      }
      return res.status(400).json({
        error: 'Upload error',
        message: err.message,
      });
    }

    // Handle custom errors
    if (err) {
      return res.status(400).json({
        error: 'Invalid file',
        message: err.message,
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please provide a resume file (PDF or DOCX)',
      });
    }

    // Validate file size (redundant but safe)
    if (!validateFileSize(req.file.size, MAX_FILE_SIZE)) {
      // Delete the uploaded file
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error('Error deleting file:', unlinkErr);
      });

      return res.status(400).json({
        error: 'File too large',
        message: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      });
    }

    // Attach file info to request for use in handlers
    req.uploadedFile = {
      path: req.file.path,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    };

    next();
  });
};

/**
 * Clean up uploaded file if needed
 * Useful for error handling in handlers
 */
const deleteUploadedFile = (filePath) => {
  return new Promise((resolve) => {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  uploadMiddleware,
  deleteUploadedFile,
};
