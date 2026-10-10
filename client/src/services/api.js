// CareAtlas Client API Service

const BASE_URL = '/api';

/**
 * Handle API responses
 */
async function handleResponse(res) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMsg = json.message || json.error || `HTTP error ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = json;
    throw err;
  }
  return json;
}

export const api = {
  // Authentication & Credentials
  async login(credentials) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    return handleResponse(res);
  },

  async register(data) {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  async getDemoCredentials() {
    const res = await fetch(`${BASE_URL}/auth/demo-credentials`);
    return handleResponse(res);
  },

  // System Health
  async getHealth() {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  // Patients
  async getPatients() {
    const res = await fetch(`${BASE_URL}/patients`);
    return handleResponse(res);
  },

  async getPatient(id) {
    const res = await fetch(`${BASE_URL}/patients/${id}`);
    return handleResponse(res);
  },

  async createPatient(patientData) {
    const res = await fetch(`${BASE_URL}/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
    });
    return handleResponse(res);
  },

  async getPatientDashboard(id) {
    const res = await fetch(`${BASE_URL}/patients/${id}/dashboard`);
    return handleResponse(res);
  },

  // Reports
  async getReports(patientId, documentType = 'All') {
    let url = `${BASE_URL}/reports?patientId=${encodeURIComponent(patientId)}`;
    if (documentType && documentType !== 'All') {
      url += `&documentType=${encodeURIComponent(documentType)}`;
    }
    const res = await fetch(url);
    return handleResponse(res);
  },

  async getReportById(id) {
    const res = await fetch(`${BASE_URL}/reports/${id}`);
    return handleResponse(res);
  },

  async uploadReport(formData) {
    const res = await fetch(`${BASE_URL}/reports`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(res);
  },

  async deleteReport(id) {
    const res = await fetch(`${BASE_URL}/reports/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  getFileUrl(id) {
    return `${BASE_URL}/reports/${id}/file`;
  },

  async correctMeasurement(reportId, { metricKey, newValue, reason, editor }) {
    const res = await fetch(`${BASE_URL}/reports/${reportId}/correct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metricKey, newValue, reason, editor }),
    });
    return handleResponse(res);
  },

  // Longitudinal Trends & Analysis
  async getTrends(patientId, window = 'all', start = null, end = null) {
    let url = `${BASE_URL}/patients/${encodeURIComponent(patientId)}/trends?window=${encodeURIComponent(window)}`;
    if (start) url += `&start=${encodeURIComponent(start)}`;
    if (end) url += `&end=${encodeURIComponent(end)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async compareReports(patientId, reportA, reportB) {
    const url = `${BASE_URL}/patients/${encodeURIComponent(patientId)}/compare-reports?reportA=${encodeURIComponent(reportA)}&reportB=${encodeURIComponent(reportB)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Data Conflicts
  async getConflicts(patientId, status = 'All') {
    let url = `${BASE_URL}/patients/${encodeURIComponent(patientId)}/conflicts`;
    if (status && status !== 'All') url += `?status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async updateConflict(patientId, conflictId, { status, resolutionNotes, reviewedBy }) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/conflicts/${encodeURIComponent(conflictId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, resolutionNotes, reviewedBy }),
    });
    return handleResponse(res);
  },

  // Medications & Drug Safety
  async getMedications(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/medications`);
    return handleResponse(res);
  },

  // Health Alerts
  async getAlerts(patientId, status = 'All') {
    let url = `${BASE_URL}/patients/${encodeURIComponent(patientId)}/alerts`;
    if (status && status !== 'All') url += `?status=${encodeURIComponent(status)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  async updateAlert(patientId, alertId, { status, dismissReason }) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/alerts/${encodeURIComponent(alertId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, dismissReason }),
    });
    return handleResponse(res);
  },

  // Medical Summary
  async getSummary(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/summary`);
    return handleResponse(res);
  },

  async regenerateSummary(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/summary`, {
      method: 'POST',
    });
    return handleResponse(res);
  },

  // Missing Records
  async getMissingRecords(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/missing-records`);
    return handleResponse(res);
  },

  // Longitudinal History Timeline
  async getPatientHistory(patientId) {
    const res = await fetch(`${BASE_URL}/patients/${encodeURIComponent(patientId)}/history`);
    return handleResponse(res);
  },

  // Data Export URLs
  getFhirExportUrl(patientId) {
    return `${BASE_URL}/patients/${encodeURIComponent(patientId)}/export/fhir`;
  },

  getCsvExportUrl(patientId) {
    return `${BASE_URL}/patients/${encodeURIComponent(patientId)}/export/csv`;
  },

  getJsonExportUrl(patientId) {
    return `${BASE_URL}/patients/${encodeURIComponent(patientId)}/export/json`;
  },

  // Audit Logs
  async getAuditLogs(patientId = null) {
    let url = `${BASE_URL}/audit-logs`;
    if (patientId) url += `?patientId=${encodeURIComponent(patientId)}`;
    const res = await fetch(url);
    return handleResponse(res);
  },

  // Health Copilot Chat
  async sendChatMessage(patientId, question, cloudConsent = false) {
    const res = await fetch(`${BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        patientId,
        question,
        cloudConsent,
      }),
    });
    return handleResponse(res);
  },
};
