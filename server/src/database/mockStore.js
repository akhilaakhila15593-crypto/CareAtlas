const { syntheticPatients, syntheticReports } = require('../seeds/syntheticData');
const { generateAlerts } = require('../services/alertEngine');
const { detectConflicts } = require('../services/conflictDetector');
const { checkMedicationSafety } = require('../services/medicationSafety');
const { generateMedicalSummary } = require('../services/summaryGenerator');

class MockStore {
  constructor() {
    this.isMock = true; // Set to true by default unless MongoDB takes over
    this.resetToDefaults();
  }

  setMockMode(isMock) {
    this.isMock = isMock;
  }

  isMockMode() {
    return this.isMock;
  }

  // --- Reset & Initialization ---
  resetToDefaults() {
    this.patients = JSON.parse(JSON.stringify(syntheticPatients));
    this.reports = JSON.parse(JSON.stringify(syntheticReports));
    this.alerts = [];
    this.conflicts = [];
    this.summaries = [];
    this.auditLogs = [];
    this.users = [
      {
        id: 'usr-001',
        name: 'Eleanor Vance',
        email: 'eleanor@careatlas.health',
        password: 'patient123',
        role: 'patient',
        patientId: 'P-101',
      },
      {
        id: 'usr-002',
        name: 'Marcus Chen',
        email: 'marcus@careatlas.health',
        password: 'patient123',
        role: 'patient',
        patientId: 'P-102',
      },
      {
        id: 'usr-003',
        name: 'Dr. Sarah Jenkins, MD',
        email: 'doctor@careatlas.health',
        password: 'doctor123',
        role: 'clinician',
        patientId: 'P-101',
      },
      {
        id: 'usr-004',
        name: 'Health Records Admin',
        email: 'demo@careatlas.health',
        password: 'demo123',
        role: 'admin',
        patientId: 'P-101',
      },
    ];

    // Pre-populate alerts, conflicts, and summaries for all seeded patients
    this.patients.forEach((patient) => {
      const pReports = this.reports.filter((r) => r.patientId === patient.demoId);
      const pConflicts = detectConflicts(patient, pReports);
      pConflicts.forEach((c) => {
        this.conflicts.push({
          _id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...c,
        });
      });

      const pMedSafety = checkMedicationSafety(pReports, patient.allergies || []);
      const pAlerts = generateAlerts(patient, pReports, this.conflicts.filter((c) => c.patientId === patient.demoId), pMedSafety);
      pAlerts.forEach((a) => {
        this.alerts.push({
          _id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...a,
        });
      });

      try {
        const pSummary = generateMedicalSummary(patient, pReports);
        this.summaries.push({
          _id: `sum-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...pSummary,
        });
      } catch (err) {
        console.warn(`Could not seed summary for ${patient.demoId}:`, err.message);
      }

      // Initial audit log entry
      this.auditLogs.push({
        _id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        patientId: patient.demoId,
        action: 'DOCUMENT_UPLOAD',
        performedBy: 'System Synthetic Seeder',
        targetId: 'Initial Seed',
        details: { recordsCount: pReports.length },
        timestamp: new Date(),
      });
    });
  }

  // --- Patients ---
  async getPatients() {
    return this.patients.map((p) => ({ ...p }));
  }

  async getPatientById(id) {
    const p = this.patients.find((p) => p.demoId === id || p._id === id);
    return p ? { ...p } : null;
  }

  async createPatient(patientData) {
    const demoId = patientData.demoId || `P-${100 + this.patients.length + 1}`;
    const newPatient = {
      _id: `pat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      demoId,
      name: patientData.name || 'New Patient',
      age: patientData.age || 40,
      sex: patientData.sex || 'Not specified',
      dateOfBirth: patientData.dateOfBirth || '1985-01-01',
      notes: patientData.notes || '',
      allergies: patientData.allergies || [],
      activeConditions: patientData.activeConditions || [],
      carePlan: patientData.carePlan || [],
      isSynthetic: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.patients.push(newPatient);

    await this.logAuditAction({
      patientId: demoId,
      action: 'PATIENT_REGISTERED',
      performedBy: 'User Action',
      targetId: demoId,
      details: { name: newPatient.name },
    });

    return { ...newPatient };
  }

  // --- Users & Authentication ---
  async findUserByEmail(email) {
    if (!this.users) this.users = [];
    const u = this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    return u ? { ...u } : null;
  }

  async createUser(userData) {
    if (!this.users) this.users = [];
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
      ...userData,
    };
    this.users.push(newUser);
    return { ...newUser };
  }

  // --- Reports ---
  async getReports({ patientId, documentType } = {}) {
    let list = this.reports;
    if (patientId) {
      list = list.filter((r) => r.patientId === patientId);
    }
    if (documentType && documentType !== 'All') {
      list = list.filter((r) => r.documentType === documentType);
    }

    // Sort descending by documentDate, falling back to createdAt
    list.sort((a, b) => {
      const dateA = a.documentDate ? new Date(a.documentDate).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const dateB = b.documentDate ? new Date(b.documentDate).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return dateB - dateA;
    });

    return list.map((r) => {
      const copy = { ...r };
      delete copy.fileBuffer;
      return copy;
    });
  }

  async getReportById(id) {
    const r = this.reports.find((item) => item._id === id || item.id === id);
    return r ? { ...r } : null;
  }

  async createReport(reportData) {
    const newReport = {
      _id: reportData._id || `rep-usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      auditTrail: [],
      ...reportData,
    };
    this.reports.unshift(newReport);

    // Refresh conflicts and alerts for this patient
    this.refreshPatientIntelligence(newReport.patientId);

    const copy = { ...newReport };
    delete copy.fileBuffer;
    return copy;
  }

  async updateReport(id, updateData) {
    const idx = this.reports.findIndex((r) => r._id === id || r.id === id);
    if (idx !== -1) {
      this.reports[idx] = {
        ...this.reports[idx],
        ...updateData,
        updatedAt: new Date(),
      };
      return { ...this.reports[idx] };
    }
    return null;
  }

  async deleteReport(id) {
    const idx = this.reports.findIndex((r) => r._id === id || r.id === id);
    if (idx !== -1) {
      const deleted = this.reports.splice(idx, 1)[0];
      this.refreshPatientIntelligence(deleted.patientId);
      return deleted;
    }
    return null;
  }

  // --- Measurement Correction ---
  async correctMeasurement(reportId, metricKey, newValue, reason, editor = 'Clinician / User') {
    const report = this.reports.find((r) => r._id === reportId || r.id === reportId);
    if (!report) return null;

    const measurement = (report.measurements || []).find((m) => m.key === metricKey);
    if (!measurement) return null;

    const previousValue = measurement.rawValue;
    const numericParsed = parseFloat(newValue);

    measurement.originalValue = measurement.originalValue || previousValue;
    measurement.rawValue = newValue;
    measurement.numericValue = isNaN(numericParsed) ? null : numericParsed;
    measurement.isCorrected = true;

    // Record in report's internal audit trail
    if (!Array.isArray(report.auditTrail)) report.auditTrail = [];
    report.auditTrail.unshift({
      action: 'MEASUREMENT_CORRECTION',
      previousValue,
      updatedValue: newValue,
      editor,
      reason,
      timestamp: new Date(),
    });

    // Record in global audit log
    await this.logAuditAction({
      patientId: report.patientId,
      action: 'RECORD_CORRECTION',
      performedBy: editor,
      targetId: reportId,
      details: { metricKey, previousValue, newValue, reason },
    });

    this.refreshPatientIntelligence(report.patientId);
    return { ...report };
  }

  // --- Conflicts ---
  async getConflicts(patientId, status = null) {
    let list = this.conflicts.filter((c) => c.patientId === patientId);
    if (status && status !== 'All') {
      list = list.filter((c) => c.status === status);
    }
    return list.map((c) => ({ ...c }));
  }

  async updateConflict(conflictId, updateData) {
    const item = this.conflicts.find((c) => c._id === conflictId || c.conflictKey === conflictId);
    if (item) {
      Object.assign(item, updateData, { updatedAt: new Date() });
      return { ...item };
    }
    return null;
  }

  // --- Alerts ---
  async getAlerts(patientId, status = null) {
    let list = this.alerts.filter((a) => a.patientId === patientId);
    if (status && status !== 'All') {
      list = list.filter((a) => a.status === status);
    }
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return list.map((a) => ({ ...a }));
  }

  async updateAlert(alertId, updateData) {
    const item = this.alerts.find((a) => a._id === alertId || a.alertKey === alertId);
    if (item) {
      Object.assign(item, updateData, { updatedAt: new Date() });
      return { ...item };
    }
    return null;
  }

  // --- Medical Summary ---
  async getSummary(patientId) {
    const list = this.summaries.filter((s) => s.patientId === patientId);
    list.sort((a, b) => new Date(b.generatedAt || b.createdAt || 0).getTime() - new Date(a.generatedAt || a.createdAt || 0).getTime());
    return list.length > 0 ? { ...list[0] } : null;
  }

  async generateAndSaveSummary(patientId) {
    const patient = await this.getPatientById(patientId);
    if (!patient) return null;

    const reports = await this.getReports({ patientId });
    const summaryData = generateMedicalSummary(patient, reports);

    const doc = {
      _id: `sum-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date(),
      ...summaryData,
    };

    this.summaries.unshift(doc);

    await this.logAuditAction({
      patientId,
      action: 'SUMMARY_REGENERATED',
      performedBy: 'User Action',
      targetId: doc._id,
      details: { documentsConsidered: doc.documentsConsidered },
    });

    return { ...doc };
  }

  // --- Audit Logs ---
  async logAuditAction({ patientId, action, performedBy = 'Authorized User', targetId = '', details = {} }) {
    const log = {
      _id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      patientId,
      action,
      performedBy,
      targetId,
      details,
      timestamp: new Date(),
    };
    this.auditLogs.unshift(log);
    return { ...log };
  }

  async getAuditLogs(patientId = null) {
    let list = this.auditLogs;
    if (patientId) {
      list = list.filter((l) => l.patientId === patientId);
    }
    return list.slice(0, 50).map((l) => ({ ...l }));
  }

  // --- Helper to Recompute Intelligence ---
  refreshPatientIntelligence(patientId) {
    const patient = this.patients.find((p) => p.demoId === patientId || p._id === patientId);
    if (!patient) return;

    const pReports = this.reports.filter((r) => r.patientId === patientId);
    const newConflicts = detectConflicts(patient, pReports);

    // Merge conflicts while retaining resolution status
    newConflicts.forEach((nc) => {
      const existing = this.conflicts.find((c) => c.patientId === patientId && c.conflictKey === nc.conflictKey);
      if (!existing) {
        this.conflicts.push({
          _id: `conf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...nc,
        });
      }
    });

    const medSafety = checkMedicationSafety(pReports, patient.allergies || []);
    const newAlerts = generateAlerts(patient, pReports, this.conflicts.filter((c) => c.patientId === patientId), medSafety);

    newAlerts.forEach((na) => {
      const existing = this.alerts.find((a) => a.patientId === patientId && a.alertKey === na.alertKey);
      if (!existing) {
        this.alerts.push({
          _id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...na,
        });
      }
    });
  }
}

const mockStore = new MockStore();

module.exports = mockStore;
