const express = require('express');
const cors = require('cors');
const fs = require('fs');
const config = require('./config');
const { connectDB, getDatabaseStatus } = require('./database/db');
const { helmetConfig, privacyMorgan, apiLimiter, errorHandler } = require('./middleware/security');
const apiRoutes = require('./routes/api');

const app = express();

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Security & Logging Middlewares
app.use(helmetConfig);
app.use(cors({ origin: true, credentials: true }));
app.use(privacyMorgan);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to /api routes
app.use('/api', apiLimiter);

// Mount API routes (support both /api prefixed endpoints and direct paths)
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Health check root
app.get('/', (req, res) => {
  res.json({
    app: 'CareAtlas — Patient Health Copilot API',
    status: 'online',
    healthCheck: '/api/health',
    version: '1.0.0',
    disclaimer: 'Prototype demo only. All data is synthetic.',
  });
});

// Centralized error handling
app.use(errorHandler);

// Start server
async function startServer() {
  await connectDB();

  const server = app.listen(config.port, () => {
    const dbStatus = getDatabaseStatus();
    console.log(`\n======================================================`);
    console.log(`🩺 CareAtlas — Patient Health Copilot API`);
    console.log(`🚀 Server listening on http://localhost:${config.port}`);
    console.log(`💾 Storage Mode: ${dbStatus.mode}`);
    console.log(`🤖 AI Copilot: ${config.openaiApiKey ? 'Cloud OpenAI Configured' : 'Local Deterministic Mode (Offline Safe)'}`);
    console.log(`🔒 Sensitive Data: Fictional synthetic data only`);
    console.log(`======================================================\n`);
  });

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
