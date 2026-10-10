import React, { useState } from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Hash,
  Edit3,
  ShieldCheck,
  FileText,
  Clock,
  Sparkles,
  ExternalLink,
  Save,
  X,
  History,
} from 'lucide-react';
import { api } from '../services/api';

export default function DocumentIntelligence({ reports = [], onRefresh }) {
  const [selectedReportId, setSelectedReportId] = useState(
    reports.length > 0 ? reports[0]._id : ''
  );

  // Correction Modal State
  const [editingMeasurement, setEditingMeasurement] = useState(null);
  const [newValue, setNewValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const currentReport =
    reports.find((r) => r._id === selectedReportId) || reports[0];

  const handleOpenEdit = (m) => {
    setEditingMeasurement(m);
    setNewValue(m.rawValue || '');
    setEditReason('');
    setActionSuccess(null);
  };

  const handleSaveCorrection = async (e) => {
    e.preventDefault();
    if (!currentReport || !editingMeasurement || !newValue.trim()) return;

    setIsSubmitting(true);
    try {
      await api.correctMeasurement(currentReport._id, {
        metricKey: editingMeasurement.key,
        newValue: newValue.trim(),
        reason: editReason.trim() || 'Manual clinical verification against original document source.',
        editor: 'Clinician / Reviewer',
      });
      setActionSuccess(`Successfully corrected ${editingMeasurement.label} to "${newValue.trim()}".`);
      setEditingMeasurement(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Correction failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!reports || reports.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <FileSearch size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
        <h3 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No Documents to Investigate</h3>
        <p style={{ color: 'var(--text-subtle)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
          Upload or seed medical reports to inspect exact textual provenance, extraction confidence, and audit trails.
        </p>
      </div>
    );
  }

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Document Selector */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FileSearch size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Real Document Intelligence & Provenance</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Inspect raw document text side-by-side with extracted clinical entities, verification flags, and audit history.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Select Document:
          </label>
          <select
            value={selectedReportId}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="select-input"
            style={{ minWidth: '280px', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
          >
            {reports.map((r) => (
              <option key={r._id} value={r._id}>
                {r.originalFilename} ({r.documentType})
              </option>
            ))}
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div style={{ backgroundColor: 'var(--accent-light)', border: '1px solid #a7f3d0', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', color: '#065f46', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {currentReport && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
          {/* Left Column: Raw Source Document View */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Source Document Text</h3>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                {currentReport.mimeType || 'text/plain'}
              </span>
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-muted)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: 1.6,
                maxHeight: '620px',
                overflowY: 'auto',
                whiteSpace: 'pre-wrap',
                border: '1px solid var(--border)',
                color: 'var(--secondary)',
              }}
            >
              {currentReport.extractedText || 'No text extracted for this record.'}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
              <span>Character count: {(currentReport.extractedText || '').length}</span>
              <span>SHA-256: {(currentReport.checksum || 'N/A').substring(0, 16)}...</span>
            </div>
          </div>

          {/* Right Column: Structured Extraction & Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Metadata Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Extraction Provenance & Metadata</h3>
                <span
                  className={`badge ${
                    currentReport.validationStatus === 'Validated'
                      ? 'badge-success'
                      : currentReport.validationStatus === 'Potential conflict'
                      ? 'badge-warning'
                      : 'badge-danger'
                  }`}
                  style={{ fontSize: '0.78rem' }}
                >
                  {currentReport.validationStatus || 'Validated'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Detected Document Date</span>
                  <strong style={{ color: 'var(--text-main)' }}>
                    {currentReport.documentDate ? new Date(currentReport.documentDate).toLocaleDateString() : 'Unconfirmed Date'}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    {currentReport.rawDateEvidence || 'No raw string found'}
                  </span>
                </div>

                <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>Extraction Confidence</span>
                  <strong style={{ color: 'var(--text-main)', textTransform: 'capitalize' }}>
                    {currentReport.extractionConfidence || 'Standard'}
                  </strong>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-subtle)', marginTop: '2px' }}>
                    {currentReport.dateExtractionMessage || 'Automated date detector'}
                  </span>
                </div>
              </div>
            </div>

            {/* Structured Measurements Table */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Extracted Measurements ({currentReport.measurements?.length || 0})</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click edit to calibrate</span>
              </div>

              {currentReport.measurements?.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="table" style={{ width: '100%', fontSize: '0.82rem', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '0.5rem 0.65rem' }}>Metric</th>
                        <th style={{ padding: '0.5rem 0.65rem' }}>Extracted Value</th>
                        <th style={{ padding: '0.5rem 0.65rem' }}>Reference</th>
                        <th style={{ padding: '0.5rem 0.65rem' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentReport.measurements.map((m, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.55rem 0.65rem', fontWeight: 600 }}>
                            {m.label}
                            {m.isCorrected && (
                              <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 400 }}>
                                (Corrected from {m.originalValue})
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            <span style={{ fontWeight: 700 }}>{m.rawValue}</span>
                            {m.abnormalFlag && m.abnormalFlag !== 'NORMAL' && m.abnormalFlag !== 'NONE' && (
                              <span className="badge badge-warning" style={{ marginLeft: '0.35rem', fontSize: '0.68rem', padding: '1px 5px' }}>
                                {m.abnormalFlag}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem', color: 'var(--text-muted)' }}>
                            {m.referenceRange || 'Standard'}
                          </td>
                          <td style={{ padding: '0.55rem 0.65rem' }}>
                            <button
                              onClick={() => handleOpenEdit(m)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Edit3 size={12} /> Correct
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
                  No discrete numeric vitals or laboratory values extracted from this document type.
                </p>
              )}
            </div>

            {/* Linked Medications & Orders */}
            {currentReport.linkedMedications?.length > 0 && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Extracted Prescriptions & Medications</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {currentReport.linkedMedications.map((med, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', color: 'var(--secondary)' }}>{med.name} {med.strength}</strong>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Directions: {med.frequency} ({med.route})
                        </span>
                      </div>
                      <span className="badge badge-info" style={{ fontSize: '0.72rem' }}>
                        {med.status || 'Active'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Rules Checklist */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} style={{ color: 'var(--primary)' }} /> Automated Validation Checklist
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem' }}>
                {(currentReport.validationDetails || []).map((vd, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                    {vd.status === 'Passed' || vd.status === 'Validated' ? (
                      <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                    ) : (
                      <AlertTriangle size={16} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: '2px' }} />
                    )}
                    <div>
                      <strong>{vd.rule}: </strong>
                      <span style={{ color: 'var(--text-muted)' }}>{vd.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Internal Audit Trail if present */}
            {currentReport.auditTrail?.length > 0 && (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#fafafa' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <History size={16} style={{ color: 'var(--text-muted)' }} /> Record Change Audit Trail
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem' }}>
                  {currentReport.auditTrail.map((at, idx) => (
                    <div key={idx} style={{ padding: '0.4rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-subtle)' }}>
                        <span>{at.editor || 'User'}</span>
                        <span>{at.timestamp ? new Date(at.timestamp).toLocaleString() : ''}</span>
                      </div>
                      <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>
                        {at.action}: Changed "{at.previousValue}" to "{at.updatedValue}"
                      </div>
                      {at.reason && <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Reason: {at.reason}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inline Measurement Correction Modal */}
      {editingMeasurement && (
        <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div className="card modal-dialog" style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Edit3 size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Correct Measurement Value</h3>
              </div>
              <button onClick={() => setEditingMeasurement(null)} style={{ color: 'var(--text-subtle)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Metric Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editingMeasurement.label}
                  className="text-input"
                  style={{ width: '100%', backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border)', padding: '0.55rem', borderRadius: 'var(--radius-sm)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  New Value & Unit (e.g., "7.2 %" or "142 mg/dL")
                </label>
                <input
                  type="text"
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="text-input"
                  placeholder="Enter corrected clinical measurement..."
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                  Clinical Justification / Audit Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g., OCR misread decimal point; confirmed against paper printout."
                  style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingMeasurement(null)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Save size={15} /> {isSubmitting ? 'Recording...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
