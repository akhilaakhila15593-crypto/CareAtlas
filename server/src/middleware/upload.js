const multer = require('multer');
const config = require('../config');

// Use memory storage so we can run OCR and parsing on buffer
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = '.' + (file.originalname.split('.').pop() || '').toLowerCase();
  const isAllowedExt = config.allowedExtensions.includes(ext);
  const isAllowedMime = config.allowedMimeTypes.includes(file.mimetype) || file.mimetype.startsWith('image/');

  if (isAllowedExt || isAllowedMime) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file format "${ext}". Supported types: PDF, DOCX, TXT, CSV, PNG, JPG, JPEG, WEBP, BMP, TIFF.`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSizeMB * 1024 * 1024,
  },
  fileFilter,
});

module.exports = upload;
