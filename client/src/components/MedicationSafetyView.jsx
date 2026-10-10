import React, { useState, useEffect } from 'react';
import {
  Pill,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
} from 'lucide-react';
import { api } from '../services/api';

export default function MedicationSafetyView({ patientId }) {
  const [safetyData, setSafetyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadMedications();
    }
  }, [patientId]);

  const loadMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMedications(patientId);
      setSafetyData(res.data);
    } catch (err) {
      console.error('Error fetching medication safety:', err);
      setError(err.message || 'Failed to load medication reconciliation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <RefreshCw size={30} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Reconciling active medications and running pharmacovigilance checks...</p>
      </div>
    );
  }

  const activeMeds = safetyData?.activeMedications || [];
  const safetyWarnings = safetyData?.safetyWarnings || [];
  const duplicateTherapies = safetyData?.duplicateTherapies || [];
  const contraindications = safetyData?.contraindications || [];

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Pill size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Medication Reconciliation & Safety Checker</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-source prescription reconciliation, drug-drug interaction detection, duplicate class alerts, and allergy screening.
          </p>
        </div>

        <button onClick={loadMedications} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <RefreshCw size={14} /> Refresh Reconciled List
        </button>
      </div>

      {/* Safety Summary Scorecard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Pill size={24} style={{ color: 'var(--primary)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Active Medications</span>
            <strong style={{ display: 'block', fontSize: '1.25rem' }}>{activeMeds.length} Prescribed</strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={24} style={{ color: safetyWarnings.length > 0 ? 'var(--danger)' : 'var(--accent)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Drug Interactions</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', color: safetyWarnings.length > 0 ? 'var(--danger)' : 'var(--accent)' }}>
              {safetyWarnings.length} Flagged
            </strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Copy size={24} style={{ color: duplicateTherapies.length > 0 ? 'var(--warning)' : 'var(--accent)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Duplicate Therapies</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', color: duplicateTherapies.length > 0 ? 'var(--warning)' : 'var(--accent)' }}>
              {duplicateTherapies.length} Detected
            </strong>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertCircle size={24} style={{ color: contraindications.length > 0 ? 'var(--danger)' : 'var(--accent)' }} />
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Allergy Warnings</span>
            <strong style={{ display: 'block', fontSize: '1.25rem', color: contraindications.length > 0 ? 'var(--danger)' : 'var(--accent)' }}>
              {contraindications.length} Flagged
            </strong>
          </div>
        </div>
      </div>

      {/* Drug Interactions Section (e.g. Lisinopril + Spironolactone) */}
      {safetyWarnings.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--danger)', backgroundColor: '#fff5f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#991b1b' }}>Potential Drug-Drug Interaction Warnings</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {safetyWarnings.map((warn, idx) => (
              <div key={idx} style={{ backgroundColor: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #fecaca', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>
                    {warn.drugA} + {warn.drugB}
                  </div>
                  <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                    {warn.severity} Severity
                  </span>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  <strong>Mechanism: </strong> {warn.mechanism}
                </div>

                <div style={{ fontSize: '0.88rem', color: '#991b1b', lineHeight: 1.6 }}>
                  <strong>Clinical Effect: </strong> {warn.clinicalEffect}
                </div>

                {warn.monitoringRecommendation && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--primary-dark)', backgroundColor: 'var(--primary-light)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginTop: '0.25rem' }}>
                    <strong>Monitoring Advice: </strong> {warn.monitoringRecommendation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duplicate Therapy Warnings */}
      {duplicateTherapies.length > 0 && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Copy size={20} style={{ color: 'var(--warning)' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Duplicate Therapeutic Class Alert</h3>
          </div>
          {duplicateTherapies.map((dup, idx) => (
            <div key={idx} style={{ fontSize: '0.9rem', color: 'var(--text-main)', backgroundColor: 'var(--bg-muted)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
              <strong>Class: {dup.className}</strong> — Multiple prescribed agents: {dup.medications?.join(', ')}. {dup.recommendation}
            </div>
          ))}
        </div>
      )}

      {/* Active Reconciled Medications Table */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Reconciled Active Medications</h3>

        {activeMeds.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Medication Name</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Dosage & Strength</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Frequency & Route</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Prescriber Source Document</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Prescription Date</th>
                </tr>
              </thead>
              <tbody>
                {activeMeds.map((med, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {med.name}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem' }}>
                      <span className="badge badge-info">{med.strength || med.dosage || 'Standard'}</span>
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-main)' }}>
                      {med.frequency || 'Daily'} ({med.route || 'Oral'})
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {med.sourceReportTitle || 'Medical Record'}
                    </td>
                    <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', color: 'var(--text-subtle)' }}>
                      {med.date ? new Date(med.date).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No active medications extracted from records.</p>
        )}
      </div>
    </div>
  );
}
