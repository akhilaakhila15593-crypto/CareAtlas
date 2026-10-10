const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { connectDB, getDatabaseStatus } = require('./database/db');
const { helmetConfig, privacyMorgan, apiLimiter, errorHandler } = require('./middleware/security');
const apiRoutes = require('./routes/api');

const app = express();

// Ensure uploads directory exists
try {
  if (!fs.existsSync(config.uploadDir)) {
    fs.mkdirSync(config.uploadDir, { recursive: true });
  }
} catch (e) {
  console.warn('⚠️ Could not create upload directory:', e.message);
}

// Security & Logging Middlewares
app.use(helmetConfig);
app.use(cors({ origin: true, credentials: true }));
app.use(privacyMorgan);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure DB connection is established for serverless / function invocations
let dbInitPromise = null;
function ensureDb() {
  if (!dbInitPromise) {
    dbInitPromise = connectDB();
  }
  return dbInitPromise;
}

app.use(async (req, res, next) => {
  try {
    await ensureDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Apply rate limiting to /api routes
app.use('/api', apiLimiter);

// Mount API routes (support both /api prefixed endpoints and direct paths)
app.use('/api', apiRoutes);
app.use(apiRoutes);

// Serve production Vite client build if present
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }
    res.sendFile(path.resolve(clientDist, 'index.html'));
  });
} else {
  // Health check root fallback if client build not generated
  app.get('/', (req, res) => {
    res.json({
      app: 'CareAtlas — Patient Health Copilot API',
      status: 'online',
      healthCheck: '/api/health',
      version: '1.0.0',
      disclaimer: 'Prototype demo only. All data is synthetic.',
    });
  });
}

// Centralized error handling
app.use(errorHandler);

// Start server
async function startServer() {
  await ensureDb();

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

module.exports = app;
module.exports.app = app;
module.exports.startServer = startServer;
