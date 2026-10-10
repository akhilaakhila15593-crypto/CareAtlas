const mockStore = require('../database/mockStore');
const Patient = require('../models/Patient');
const Report = require('../models/Report');

/**
 * Helper to fetch patient from DB or mock store.
 */
async function fetchPatient(id) {
  if (mockStore.isMockMode()) {
    return await mockStore.getPatientById(id);
  }
  return await Patient.findOne({ $or: [{ demoId: id }, { _id: id }] }).lean();
}

/**
 * Helper to fetch patient reports from DB or mock store.
 */
async function fetchPatientReports(patientId) {
  if (mockStore.isMockMode()) {
    return await mockStore.getReports({ patientId });
  }
  return await Report.find({ patientId }).sort({ documentDate: -1, createdAt: -1 }).lean();
}

/**
 * GET /api/patients
 */
async function getPatients(req, res, next) {
  try {
    if (mockStore.isMockMode()) {
      const list = await mockStore.getPatients();
      return res.json({ success: true, count: list.length, data: list });
    }
    const patients = await Patient.find().lean();
    return res.json({ success: true, count: patients.length, data: patients });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id
 */
async function getPatientById(req, res, next) {
  try {
    const patient = await fetchPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }
    return res.json({ success: true, data: patient });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/dashboard
 * Aggregates summary statistics, latest values by metric, trends for metrics with
 * multiple dated observations, recent timeline, and medical disclaimer.
 */
async function getPatientDashboard(req, res, next) {
  try {
    const patient = await fetchPatient(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, error: 'Patient not found' });
    }

    const reports = await fetchPatientReports(patient.demoId || patient._id);

    // 1. Record counts & categories
    const categoryCounts = {};
    let totalMeasurementsCount = 0;
    const allMeasurements = [];

    reports.forEach((r) => {
      const type = r.documentType || 'Other';
      categoryCounts[type] = (categoryCounts[type] || 0) + 1;

      (r.measurements || []).forEach((m) => {
        totalMeasurementsCount++;
        allMeasurements.push({
          ...m,
          reportId: r._id,
          reportTitle: r.originalFilename,
          documentDate: m.date || r.documentDate,
        });
      });
    });

    // 2. Newest dated record
    const datedReports = reports.filter((r) => r.documentDate);
    const newestRecord = datedReports.length > 0 ? datedReports[0] : (reports[0] || null);

    // 3. Latest values by metric
    const latestValuesMap = new Map();
    // Sort all measurements descending by date
    allMeasurements.sort((a, b) => {
      const dA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
      const dB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
      return dB - dA;
    });

    allMeasurements.forEach((m) => {
      if (!latestValuesMap.has(m.key)) {
        latestValuesMap.set(m.key, m);
      }
    });

    const latestMetrics = Array.from(latestValuesMap.values());

    // 4. Trend series for metrics with multiple observations
    const metricGroups = {};
    allMeasurements.forEach((m) => {
      if (!metricGroups[m.key]) {
        metricGroups[m.key] = [];
      }
      metricGroups[m.key].push(m);
    });

    const trendSeries = [];
    Object.entries(metricGroups).forEach(([key, items]) => {
      if (items.length >= 2) {
        // Sort ascending chronologically for chart display
        const chronological = items.sort((a, b) => {
          const dA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
          const dB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
          return dA - dB;
        });

        trendSeries.push({
          key,
          label: items[0].label || key,
          unit: items[0].unit || '',
          referenceRange: items[0].referenceRange || '',
          pointsCount: chronological.length,
          dataPoints: chronological.map((item) => ({
            date: item.documentDate ? new Date(item.documentDate).toISOString().split('T')[0] : 'N/A',
            rawValue: item.rawValue,
            numericValue: item.numericValue,
            reportTitle: item.reportTitle,
            reportId: item.reportId,
          })),
        });
      }
    });

    // 5. Recent timeline
    const timeline = reports.slice(0, 10).map((r) => ({
      id: r._id,
      title: r.originalFilename,
      documentType: r.documentType,
      documentDate: r.documentDate,
      rawDateEvidence: r.rawDateEvidence,
      extractionConfidence: r.extractionConfidence,
      measurementsCount: (r.measurements || []).length,
      summary: r.summary,
    }));

    return res.json({
      success: true,
      data: {
        patient,
        summary: {
          totalRecords: reports.length,
          categoryCounts,
          totalMeasurements: totalMeasurementsCount,
          newestRecordDate: newestRecord ? newestRecord.documentDate : null,
          newestRecordTitle: newestRecord ? newestRecord.originalFilename : null,
        },
        latestMetrics,
        trendSeries,
        timeline,
        disclaimer: {
          isSynthetic: true,
          notice: 'Demonstration and prototype use only. All data displayed is synthetic and non-identifiable. Not intended for clinical or diagnostic use.',
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/patients
 * Create new patient profile
 */
async function createPatient(req, res, next) {
  try {
    const { name, age, sex, dateOfBirth, notes, allergies = [], activeConditions = [], carePlan = [] } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Patient name is required.' });
    }

    const patientData = {
      name: name.trim(),
      age: age ? parseInt(age, 10) : 40,
      sex: sex || 'Not specified',
      dateOfBirth: dateOfBirth || '1985-01-01',
      notes: notes || '',
      allergies: Array.isArray(allergies) ? allergies : [],
      activeConditions: Array.isArray(activeConditions) ? activeConditions : (notes ? [notes] : ['General Wellness']),
      carePlan: Array.isArray(carePlan) ? carePlan : [],
      isSynthetic: true,
    };

    let newPatient = null;
    if (mockStore.isMockMode()) {
      newPatient = await mockStore.createPatient(patientData);
    } else {
      const demoId = `P-${Date.now().toString().slice(-4)}`;
      const doc = new Patient({ ...patientData, demoId });
      newPatient = await doc.save();
    }

    return res.status(201).json({
      success: true,
      message: `Patient profile for ${newPatient.name} created successfully.`,
      data: newPatient,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getPatients,
  getPatientById,
  getPatientDashboard,
  createPatient,
};
