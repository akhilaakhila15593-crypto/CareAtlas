const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI ? process.env.MONGODB_URI.trim() : '',
  openaiApiKey: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : '',
  enableCloudAi: process.env.ENABLE_CLOUD_AI === 'true',
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '15', 10),
  uploadDir: path.resolve(__dirname, '../../uploads'),
  allowedMimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/bmp',
    'image/tiff',
  ],
  allowedExtensions: ['.pdf', '.docx', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.bmp', '.tiff', '.tif'],
};

module.exports = config;
