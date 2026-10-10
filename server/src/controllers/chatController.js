const mockStore = require('../database/mockStore');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const { processHealthQuery } = require('../services/aiAssistant');

/**
 * POST /api/chat
 * Patient-specific Health Assistant endpoint.
 */
async function handleChat(req, res, next) {
  try {
    const { patientId, question, cloudConsent = false } = req.body;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required in request body.' });
    }

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'question text is required.' });
    }

    // 1. Fetch patient
    let patient = null;
    if (mockStore.isMockMode()) {
      patient = await mockStore.getPatientById(patientId);
    } else {
      patient = await Patient.findOne({ $or: [{ demoId: patientId }, { _id: patientId }] }).lean();
    }

    if (!patient) {
      return res.status(404).json({ success: false, error: `Patient with ID ${patientId} not found.` });
    }

    // 2. Fetch only this patient's records
    let reports = [];
    if (mockStore.isMockMode()) {
      reports = await mockStore.getReports({ patientId: patient.demoId || patient._id });
    } else {
      reports = await Report.find({ patientId: patient.demoId || patient._id })
        .sort({ documentDate: 1 })
        .lean();
    }

    // 3. Process question through health copilot engine
    const result = await processHealthQuery({
      patient,
      reports,
      question: question.trim(),
      cloudConsent: Boolean(cloudConsent),
    });

    return res.json({
      success: true,
      data: {
        ...result,
        patientId: patient.demoId || patient._id,
        patientName: patient.name,
        disclaimer: 'CareAtlas is an informational record organizer and does not provide clinical diagnosis or medical treatment advice. Always verify extracted evidence against original medical documents.',
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  handleChat,
};
