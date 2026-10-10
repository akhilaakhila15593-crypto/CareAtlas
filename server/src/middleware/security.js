const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');

// Rate limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP address. Please try again after 15 minutes.',
  },
});

// Configure Helmet with loose CSP for dev/API
const helmetConfig = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
});

// Privacy-conscious HTTP Logger: logs HTTP method, status, response time.
// STRICTLY excludes request/response body to prevent accidental logging of PHI or extracted text.
const privacyMorgan = morgan(':method :url :status :res[content-length] - :response-time ms');

// Centralized error handler
const errorHandler = (err, req, res, next) => {
  console.error(`❌ [Error Handler] ${err.name || 'Error'}: ${err.message}`);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: 'File size limit exceeded',
      message: `File exceeds maximum allowed size limit.`,
    });
  }

  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected error occurred while processing the request.',
  });
};

module.exports = {
  apiLimiter,
  helmetConfig,
  privacyMorgan,
  errorHandler,
};
