import React, { useState, useEffect } from 'react';
import {
  Shield,
  Download,
  FileSpreadsheet,
  FileCode,
  Share2,
  Lock,
  History,
  CheckCircle2,
  RefreshCw,
  Server,
} from 'lucide-react';
import { api } from '../services/api';

export default function PrivacySettingsView({
  patientId,
  cloudConsent,
  onToggleCloudConsent,
  dbStatus,
}) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    loadLogs();
  }, [patientId]);

  const loadLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await api.getAuditLogs(patientId);
      setAuditLogs(res.data || []);
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleDownloadFhir = () => {
    window.open(api.getFhirExportUrl(patientId), '_blank');
  };

  const handleDownloadCsv = () => {
    window.open(api.getCsvExportUrl(patientId), '_blank');
  };

  const handleDownloadJson = () => {
    window.open(api.getJsonExportUrl(patientId), '_blank');
  };

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Privacy, Data Governance & Interoperability</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Enterprise privacy guarantees, HL7 FHIR R4 export interoperability, and immutable access audit logs.
          </p>
        </div>
      </div>

      {/* Interoperability & Export Standards Cards */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Medical Interoperability & Data Export</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Export this patient's complete longitudinal record conforming to global health IT standards.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {/* FHIR R4 Bundle */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <Share2 size={18} style={{ color: 'var(--primary)' }} />
                <strong style={{ fontSize: '1rem' }}>HL7® FHIR® R4 Bundle</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Standard clinical collection bundle including Patient, Observation (with LOINC codes), DocumentReference, and MedicationRequest resources.
              </p>
            </div>
            <button onClick={handleDownloadFhir} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Download FHIR R4 JSON
            </button>
          </div>

          {/* Standard CSV */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <FileSpreadsheet size={18} style={{ color: 'var(--accent)' }} />
                <strong style={{ fontSize: '1rem' }}>Structured Tabular CSV</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Row-level export containing observation dates, metrics, units, reference intervals, abnormal flags, and exact document text snippets.
              </p>
            </div>
            <button onClick={handleDownloadCsv} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Download CSV Spreadsheet
            </button>
          </div>

          {/* Full JSON Snapshot */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                <FileCode size={18} style={{ color: 'var(--secondary)' }} />
                <strong style={{ fontSize: '1rem' }}>Complete JSON Snapshot</strong>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Full comprehensive snapshot containing complete patient profile, all reports, extracted entities, and medication reconciliation.
              </p>
            </div>
            <button onClick={handleDownloadJson} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <Download size={14} /> Download Full JSON
            </button>
          </div>
        </div>
      </div>

      {/* Privacy Architecture & Local Processing */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Lock size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>AI Privacy & Processing Controls</h3>
        </div>

        <div style={{ backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong style={{ fontSize: '0.95rem', display: 'block', color: 'var(--secondary)' }}>
              Cloud AI External Transmission Consent
            </strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.25rem 0 0', maxWidth: '650px' }}>
              When disabled, 100% of question answering, document OCR, and trend calculation occurs on this system with local deterministic algorithms. No patient data or document text leaves this server.
            </p>
          </div>

          <button
            onClick={onToggleCloudConsent}
            className={`btn ${cloudConsent ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.85rem' }}
          >
            {cloudConsent ? 'Cloud AI: Enabled' : 'Local Deterministic Only'}
          </button>
        </div>
      </div>

      {/* Security & Access Audit Trail */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <History size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Audit Trail & Governance Log</h3>
          </div>
          <button onClick={loadLogs} className="btn btn-outline btn-sm" style={{ padding: '0.35rem' }}>
            <RefreshCw size={13} className={loadingLogs ? 'spin' : ''} />
          </button>
        </div>

        {loadingLogs ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading access logs...</p>
        ) : auditLogs.length === 0 ? (
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No audit actions logged yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Timestamp</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Action</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>User / Actor</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Target</th>
                  <th style={{ padding: '0.5rem 0.75rem' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-subtle)' }}>
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>
                      {log.performedBy}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--secondary)' }}>
                      {log.targetId || 'Patient Record'}
                    </td>
                    <td style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
