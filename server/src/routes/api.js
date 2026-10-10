const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { getDatabaseStatus } = require('../database/db');
const config = require('../config');

const authController = require('../controllers/authController');
const patientController = require('../controllers/patientController');
const reportController = require('../controllers/reportController');
const chatController = require('../controllers/chatController');
const clinicalController = require('../controllers/clinicalController');

// GET /api/health
router.get('/health', (req, res) => {
  const dbStatus = getDatabaseStatus();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'CareAtlas — Patient Health Copilot API',
    database: dbStatus,
    cloudAi: {
      serverEnabled: Boolean(config.enableCloudAi && config.openaiApiKey),
      provider: config.openaiApiKey ? 'OpenAI GPT-4o-mini' : 'Local Deterministic Fallback',
    },
    privacy: {
      demoMode: true,
      syntheticDataOnly: true,
    },
  });
});

// Authentication Routes
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.get('/auth/demo-credentials', authController.getDemoCredentials);

// Patient Routes
router.get('/patients', patientController.getPatients);
router.post('/patients', patientController.createPatient);
router.get('/patients/:id', patientController.getPatientById);
router.get('/patients/:id/dashboard', patientController.getPatientDashboard);

// Clinical Intelligence Routes
router.get('/patients/:id/trends', clinicalController.getTrends);
router.get('/patients/:id/compare-reports', clinicalController.compareReports);
router.get('/patients/:id/conflicts', clinicalController.getConflicts);
router.patch('/patients/:id/conflicts/:conflictId', clinicalController.updateConflict);
router.get('/patients/:id/medications', clinicalController.getMedications);
router.get('/patients/:id/alerts', clinicalController.getAlerts);
router.patch('/patients/:id/alerts/:alertId', clinicalController.updateAlert);
router.get('/patients/:id/summary', clinicalController.getSummary);
router.post('/patients/:id/summary', clinicalController.regenerateSummary);
router.get('/patients/:id/missing-records', clinicalController.getMissingRecords);
router.get('/patients/:id/history', clinicalController.getPatientHistory);

// Standards & Export Routes
router.get('/patients/:id/export/fhir', clinicalController.exportFhir);
router.get('/patients/:id/export/csv', clinicalController.exportCsv);
router.get('/patients/:id/export/json', clinicalController.exportJson);

// Medical Record Routes
router.get('/reports', reportController.getReports);
router.get('/reports/:id', reportController.getReportById);
router.post('/reports', upload.single('file'), reportController.uploadReport);
router.get('/reports/:id/file', reportController.getReportFile);
router.delete('/reports/:id', reportController.deleteReport);
router.post('/reports/:id/correct', clinicalController.correctMeasurement);

// Audit & Governance Routes
router.get('/audit-logs', clinicalController.getAuditLogs);

// AI Health Copilot Route
router.post('/chat', chatController.handleChat);

module.exports = router;
