import multer from 'multer';

// Memory storage keeps file buffers in memory for direct Cloudinary stream processing
const storage = multer.memoryStorage();

const multerInstance = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size limit
  },
  fileFilter: (req, file, cb) => {
    // Validate image MIME type
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      const err = new Error('Invalid file format. Only image files (JPEG, PNG, WEBP, GIF) are allowed.');
      err.statusCode = 400;
      cb(err, false);
    }
  },
});

/**
 * Express middleware wrapper for single file uploads.
 * Gracefully captures Multer/storage errors and passes them to next()
 * instead of letting unhandled errors crash the process or leave requests hanging.
 *
 * @param {string} fieldName - Form multipart field name (default: 'image')
 */
export const uploadSingleImage = (fieldName = 'image') => {
  const upload = multerInstance.single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            err.statusCode = 400;
            err.message = 'Uploaded image file exceeds the 10MB size limit.';
          } else {
            err.statusCode = 400;
            err.message = `Upload error: ${err.message}`;
          }
        } else if (!err.statusCode) {
          err.statusCode = 400;
        }
        return next(err);
      }
      next();
    });
  };
};

export const upload = multerInstance;
export default uploadSingleImage;
