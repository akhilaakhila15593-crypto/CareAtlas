import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Clock,
  Layers,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';

export default function DataValidationView({ patientId, reports = [], onRefresh }) {
  const [missingRecords, setMissingRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadValidationData();
    }
  }, [patientId]);

  const loadValidationData = async () => {
    setLoading(true);
    try {
      const res = await api.getMissingRecords(patientId);
      setMissingRecords(res.data || []);
    } catch (err) {
      console.error('Error fetching missing record tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group reports by validation status
  const statusCounts = {
    Validated: 0,
    'Needs review': 0,
    'Uncertain extraction': 0,
    'Potential conflict': 0,
    'Duplicate candidate': 0,
  };

  reports.forEach((r) => {
    const st = r.validationStatus || 'Validated';
    statusCounts[st] = (statusCounts[st] || 0) + 1;
  });

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <ShieldCheck size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Medical Data Validation & Integrity</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-point automated verification across physiological plausibility bounds, date sequence integrity, OCR legibility, and demographic consistency.
          </p>
        </div>

        <button onClick={loadValidationData} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={14} /> Re-run Validation Engine
        </button>
      </div>

      {/* Validation Status Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ borderTop: '4px solid var(--accent)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Validated Clean</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--accent)', marginTop: '0.25rem' }}>
            {statusCounts['Validated']} Files
          </strong>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--warning)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Needs Clinical Review</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--warning)', marginTop: '0.25rem' }}>
            {statusCounts['Needs review']} Files
          </strong>
        </div>

        <div className="card" style={{ borderTop: '4px solid #ca8a04' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Uncertain OCR / Scan</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: '#ca8a04', marginTop: '0.25rem' }}>
            {statusCounts['Uncertain extraction']} Files
          </strong>
        </div>

        <div className="card" style={{ borderTop: '4px solid var(--danger)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Cross-Doc Conflicts</span>
          <strong style={{ display: 'block', fontSize: '1.4rem', color: 'var(--danger)', marginTop: '0.25rem' }}>
            {statusCounts['Potential conflict']} Files
          </strong>
        </div>
      </div>

      {/* Missing Records & Diagnostic Follow-up Tasks */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <HelpCircle size={20} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Diagnostic Gaps & Missing Information Tasks</h3>
        </div>

        {missingRecords.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {missingRecords.map((task) => (
              <div
                key={task.id}
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>
                      {task.status}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--secondary)' }}>{task.title}</strong>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                    {task.description}
                  </p>
                </div>

                <span className="badge badge-info" style={{ fontSize: '0.78rem' }}>
                  {task.actionLabel}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>
            No unresolved diagnostic gaps or missing follow-up reports detected.
          </p>
        )}
      </div>

      {/* Physiological Bounds Validation Rules Reference */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Physiological Plausibility Rules Reference</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          The engine checks all numerical extractions against biologically plausible boundaries to catch OCR calibration or scanning artifacts.
        </p>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                <th style={{ padding: '0.5rem 0.75rem' }}>Marker</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Unit</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Biological Plausibility Range</th>
                <th style={{ padding: '0.5rem 0.75rem' }}>Engine Rule Action</th>
              </tr>
            </thead>
            <tbody>
              {[
                { marker: 'Blood Glucose (Fasting & Post-meal)', unit: 'mg/dL', range: '30 – 800 mg/dL', action: 'Flag as physiological outlier if outside range' },
                { marker: 'Hemoglobin A1c (HbA1c)', unit: '%', range: '3.0 – 22.0 %', action: 'Flag as implausible extraction if outside range' },
                { marker: 'Systolic Blood Pressure', unit: 'mmHg', range: '60 – 260 mmHg', action: 'Require manual clinical review' },
                { marker: 'Diastolic Blood Pressure', unit: 'mmHg', range: '35 – 160 mmHg', action: 'Require manual clinical review' },
                { marker: 'Serum Creatinine', unit: 'mg/dL', range: '0.20 – 20.0 mg/dL', action: 'Flag as implausible extraction if outside range' },
                { marker: 'Total / LDL / HDL Cholesterol', unit: 'mg/dL', range: '10 – 600 mg/dL', action: 'Verify lab report format if outside range' },
              ].map((row, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600 }}>{row.marker}</td>
                  <td style={{ padding: '0.55rem 0.75rem' }}>{row.unit}</td>
                  <td style={{ padding: '0.55rem 0.75rem', fontWeight: 600, color: 'var(--primary)' }}>{row.range}</td>
                  <td style={{ padding: '0.55rem 0.75rem', color: 'var(--text-muted)' }}>{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
