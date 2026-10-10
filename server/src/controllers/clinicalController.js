const mockStore = require('../database/mockStore');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const HealthAlert = require('../models/HealthAlert');
const DataConflict = require('../models/DataConflict');
const MedicalSummary = require('../models/MedicalSummary');
const AuditLog = require('../models/AuditLog');

const { analyzeLongitudinalTrends, compareTwoReports } = require('../services/longitudinalEngine');
const { checkMedicationSafety } = require('../services/medicationSafety');
const { detectConflicts } = require('../services/conflictDetector');
const { generateAlerts } = require('../services/alertEngine');
const { generateMedicalSummary } = require('../services/summaryGenerator');
const { detectMissingRecords } = require('../services/missingRecordDetector');
const { exportToFhirR4, exportToCsv } = require('../services/interoperability');
const { recordCorrection } = require('../services/validationEngine');

// Helper to fetch patient
async function fetchPatient(id) {
  if (mockStore.isMockMode()) {
    return await mockStore.getPatientById(id);
  }
  return await Patient.findOne({ $or: [{ demoId: id }, { _id: id }] }).lean();
}

// Helper to fetch patient reports
async function fetchPatientReports(patientId) {
  if (mockStore.isMockMode()) {
    return await mockStore.getReports({ patientId });
  }
  return await Report.find({ patientId }).sort({ documentDate: -1, createdAt: -1 }).lean();
}

// Helper to log audit
async function logAudit(patientId, action, performedBy, targetId, details) {
  if (mockStore.isMockMode()) {
    return await mockStore.logAuditAction({ patientId, action, performedBy, targetId, details });
  }
  const entry = new AuditLog({
    patientId,
    action,
    performedBy: performedBy || 'Authorized User',
    targetId: targetId || '',
    details: details || {},
    timestamp: new Date(),
  });
  return await entry.save();
}

/**
 * GET /api/patients/:id/trends
 */
async function getTrends(req, res, next) {
  try {
    const { id } = req.params;
    const { window = 'all', start = null, end = null } = req.query;

    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const trends = analyzeLongitudinalTrends(reports, window, start, end);

    return res.json({
      success: true,
      data: {
        patientId: patient.demoId || patient._id,
        patientName: patient.name,
        timeWindow: window,
        trends,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/compare-reports
 */
async function compareReports(req, res, next) {
  try {
    const { id } = req.params;
    const { reportA: repIdA, reportB: repIdB } = req.query;

    if (!repIdA || !repIdB) {
      return res.status(400).json({ success: false, error: 'Both reportA and reportB query parameters are required.' });
    }

    let reportA = null;
    let reportB = null;

    if (mockStore.isMockMode()) {
      reportA = await mockStore.getReportById(repIdA);
      reportB = await mockStore.getReportById(repIdB);
    } else {
      reportA = await Report.findById(repIdA).lean();
      reportB = await Report.findById(repIdB).lean();
    }

    if (!reportA || !reportB) {
      return res.status(404).json({ success: false, error: 'One or both reports not found.' });
    }

    const comparison = compareTwoReports(reportA, reportB);

    return res.json({
      success: true,
      data: comparison,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/conflicts
 */
async function getConflicts(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const patientId = patient.demoId || patient._id;
    let list = [];

    if (mockStore.isMockMode()) {
      list = await mockStore.getConflicts(patientId, status);
    } else {
      const query = { patientId };
      if (status && status !== 'All') query.status = status;
      list = await DataConflict.find(query).sort({ updatedAt: -1 }).lean();
      if (list.length === 0) {
        // Run live detector and save
        const reports = await fetchPatientReports(patientId);
        const liveConflicts = detectConflicts(patient, reports);
        for (const c of liveConflicts) {
          await DataConflict.findOneAndUpdate({ patientId, conflictKey: c.conflictKey }, c, { upsert: true, new: true });
        }
        list = await DataConflict.find(query).sort({ updatedAt: -1 }).lean();
      }
    }

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/patients/:id/conflicts/:conflictId
 */
async function updateConflict(req, res, next) {
  try {
    const { id, conflictId } = req.params;
    const { status, resolutionNotes, reviewedBy = 'Clinician / User' } = req.body;

    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    let updated = null;
    const updatePayload = {
      status,
      resolutionNotes: resolutionNotes || '',
      reviewedBy,
      reviewedAt: new Date(),
    };

    if (mockStore.isMockMode()) {
      updated = await mockStore.updateConflict(conflictId, updatePayload);
    } else {
      updated = await DataConflict.findOneAndUpdate(
        { $or: [{ _id: conflictId }, { conflictKey: conflictId }] },
        updatePayload,
        { new: true }
      ).lean();
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Data conflict record not found.' });
    }

    await logAudit(patient.demoId || patient._id, 'CONFLICT_RESOLVED', reviewedBy, conflictId, {
      status,
      resolutionNotes,
    });

    return res.json({
      success: true,
      message: 'Conflict status updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/medications
 */
async function getMedications(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const medSafety = checkMedicationSafety(reports, patient.allergies || []);

    return res.json({
      success: true,
      data: {
        patientId: patient.demoId || patient._id,
        patientName: patient.name,
        allergies: patient.allergies || [],
        ...medSafety,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/alerts
 */
async function getAlerts(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.query;

    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const patientId = patient.demoId || patient._id;
    let list = [];

    if (mockStore.isMockMode()) {
      list = await mockStore.getAlerts(patientId, status);
    } else {
      const query = { patientId };
      if (status && status !== 'All') query.status = status;
      list = await HealthAlert.find(query).sort({ createdAt: -1 }).lean();
      if (list.length === 0) {
        // Re-generate live alerts
        const reports = await fetchPatientReports(patientId);
        const conflicts = await DataConflict.find({ patientId }).lean();
        const medSafety = checkMedicationSafety(reports, patient.allergies || []);
        const liveAlerts = generateAlerts(patient, reports, conflicts, medSafety);
        for (const a of liveAlerts) {
          await HealthAlert.findOneAndUpdate({ patientId, alertKey: a.alertKey }, a, { upsert: true, new: true });
        }
        list = await HealthAlert.find(query).sort({ createdAt: -1 }).lean();
      }
    }

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/patients/:id/alerts/:alertId
 */
async function updateAlert(req, res, next) {
  try {
    const { id, alertId } = req.params;
    const { status, dismissReason = '' } = req.body;

    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    let updated = null;
    const updatePayload = {
      status,
      dismissReason,
      acknowledgedAt: status === 'acknowledged' ? new Date() : null,
    };

    if (mockStore.isMockMode()) {
      updated = await mockStore.updateAlert(alertId, updatePayload);
    } else {
      updated = await HealthAlert.findOneAndUpdate(
        { $or: [{ _id: alertId }, { alertKey: alertId }] },
        updatePayload,
        { new: true }
      ).lean();
    }

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Health alert not found.' });
    }

    await logAudit(patient.demoId || patient._id, 'ALERT_ACKNOWLEDGED', 'User Action', alertId, {
      status,
      dismissReason,
    });

    return res.json({
      success: true,
      message: 'Alert status updated.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/summary
 */
async function getSummary(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const patientId = patient.demoId || patient._id;
    let summary = null;

    if (mockStore.isMockMode()) {
      summary = await mockStore.getSummary(patientId);
    } else {
      summary = await MedicalSummary.findOne({ patientId }).sort({ generatedAt: -1 }).lean();
    }

    // If none exists, generate one automatically
    if (!summary) {
      const reports = await fetchPatientReports(patientId);
      const generated = generateMedicalSummary(patient, reports);
      if (mockStore.isMockMode()) {
        summary = await mockStore.generateAndSaveSummary(patientId);
      } else {
        const doc = new MedicalSummary(generated);
        summary = await doc.save();
      }
    }

    return res.json({
      success: true,
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/patients/:id/summary
 */
async function regenerateSummary(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const patientId = patient.demoId || patient._id;
    let newSummary = null;

    if (mockStore.isMockMode()) {
      newSummary = await mockStore.generateAndSaveSummary(patientId);
    } else {
      const reports = await fetchPatientReports(patientId);
      const generated = generateMedicalSummary(patient, reports);
      const doc = new MedicalSummary(generated);
      newSummary = await doc.save();

      await logAudit(patientId, 'SUMMARY_REGENERATED', 'User Action', newSummary._id, {
        documentsConsidered: newSummary.documentsConsidered,
      });
    }

    return res.json({
      success: true,
      message: 'Medical summary regenerated successfully.',
      data: newSummary,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/missing-records
 */
async function getMissingRecords(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const tasks = detectMissingRecords(patient, reports);

    return res.json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/history
 */
async function getPatientHistory(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);

    // Build rich chronological timeline
    const events = [];

    reports.forEach((r) => {
      // 1. Document upload / encounter event
      events.push({
        id: `evt-doc-${r._id}`,
        type: 'document',
        date: r.documentDate || r.createdAt,
        title: `${r.documentType}: ${r.originalFilename}`,
        summary: r.summary,
        documentType: r.documentType,
        sourceReportId: r._id,
        confidence: r.extractionConfidence,
        validationStatus: r.validationStatus,
      });

      // 2. Measurements in this report
      (r.measurements || []).forEach((m, idx) => {
        if (m.abnormalFlag === 'HIGH' || m.abnormalFlag === 'CRITICAL' || m.key === 'hba1c' || m.key === 'glucose') {
          events.push({
            id: `evt-meas-${r._id}-${idx}`,
            type: 'measurement',
            date: m.date || r.documentDate || r.createdAt,
            title: `${m.label}: ${m.rawValue}`,
            summary: `Reference Range: ${m.referenceRange || 'Standard'}. Flag: ${m.abnormalFlag || 'NORMAL'}. Source: ${r.originalFilename}`,
            documentType: r.documentType,
            sourceReportId: r._id,
            abnormalFlag: m.abnormalFlag,
          });
        }
      });

      // 3. Medications prescribed
      (r.linkedMedications || []).forEach((med, idx) => {
        events.push({
          id: `evt-med-${r._id}-${idx}`,
          type: 'medication',
          date: r.prescriptionDate || r.documentDate || r.createdAt,
          title: `Prescription Order: ${med.name} ${med.strength}`,
          summary: `Frequency: ${med.frequency}. Source: ${r.originalFilename}`,
          documentType: r.documentType,
          sourceReportId: r._id,
        });
      });
    });

    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/export/fhir
 */
async function exportFhir(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const bundle = exportToFhirR4(patient, reports);

    await logAudit(patient.demoId || patient._id, 'DATA_EXPORT_FHIR', 'Authorized User', 'FHIR-R4-Bundle', {
      resourceCount: (bundle.entry || []).length,
    });

    res.setHeader('Content-Type', 'application/fhir+json');
    res.setHeader('Content-Disposition', `attachment; filename="careatlas-fhir-${patient.demoId || id}.json"`);
    return res.json(bundle);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/export/csv
 */
async function exportCsv(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const csvData = exportToCsv(patient, reports);

    await logAudit(patient.demoId || patient._id, 'DATA_EXPORT_CSV', 'Authorized User', 'CSV-Export', {});

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="careatlas-records-${patient.demoId || id}.csv"`);
    return res.send(csvData);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/patients/:id/export/json
 */
async function exportJson(req, res, next) {
  try {
    const { id } = req.params;
    const patient = await fetchPatient(id);
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const reports = await fetchPatientReports(patient.demoId || patient._id);
    const medSafety = checkMedicationSafety(reports, patient.allergies || []);

    const exportPayload = {
      exportMetadata: {
        system: 'CareAtlas — Patient Health Copilot',
        exportedAt: new Date().toISOString(),
        format: 'Complete JSON Record Snapshot',
        version: '1.0',
      },
      patient,
      reports: reports.map((r) => {
        const c = { ...r };
        delete c.fileBuffer;
        return c;
      }),
      medicationReconciliation: medSafety,
    };

    await logAudit(patient.demoId || patient._id, 'DATA_EXPORT_JSON', 'Authorized User', 'JSON-Snapshot', {});

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="careatlas-full-export-${patient.demoId || id}.json"`);
    return res.json(exportPayload);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reports/:id/correct
 * Inline measurement correction with audit entry
 */
async function correctMeasurement(req, res, next) {
  try {
    const { id } = req.params;
    const { metricKey, newValue, reason = '', editor = 'Clinician / User' } = req.body;

    if (!metricKey || newValue === undefined) {
      return res.status(400).json({ success: false, error: 'metricKey and newValue are required.' });
    }

    if (mockStore.isMockMode()) {
      const updated = await mockStore.correctMeasurement(id, metricKey, newValue, reason, editor);
      if (!updated) {
        return res.status(404).json({ success: false, error: 'Report or measurement not found.' });
      }
      return res.json({
        success: true,
        message: 'Measurement corrected and recorded in audit log.',
        data: updated,
      });
    }

    const report = await Report.findById(id);
    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found.' });
    }

    const m = report.measurements.find((item) => item.key === metricKey);
    if (!m) {
      return res.status(404).json({ success: false, error: `Measurement "${metricKey}" not found in report.` });
    }

    const previousValue = m.rawValue;
    const numericParsed = parseFloat(newValue);

    m.originalValue = m.originalValue || previousValue;
    m.rawValue = newValue;
    m.numericValue = isNaN(numericParsed) ? null : numericParsed;
    m.isCorrected = true;

    recordCorrection({
      report,
      field: metricKey,
      previousValue,
      updatedValue: newValue,
      editor,
      reason,
    });

    const saved = await report.save();

    await logAudit(report.patientId, 'RECORD_CORRECTION', editor, id, {
      metricKey,
      previousValue,
      newValue,
      reason,
    });

    return res.json({
      success: true,
      message: 'Measurement corrected and auditable log recorded.',
      data: saved,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/audit-logs
 */
async function getAuditLogs(req, res, next) {
  try {
    const { patientId } = req.query;
    let list = [];

    if (mockStore.isMockMode()) {
      list = await mockStore.getAuditLogs(patientId);
    } else {
      const filter = patientId ? { patientId } : {};
      list = await AuditLog.find(filter).sort({ timestamp: -1 }).limit(50).lean();
    }

    return res.json({
      success: true,
      count: list.length,
      data: list,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTrends,
  compareReports,
  getConflicts,
  updateConflict,
  getMedications,
  getAlerts,
  updateAlert,
  getSummary,
  regenerateSummary,
  getMissingRecords,
  getPatientHistory,
  exportFhir,
  exportCsv,
  exportJson,
  correctMeasurement,
  getAuditLogs,
};
