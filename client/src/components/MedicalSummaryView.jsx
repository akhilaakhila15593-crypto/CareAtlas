import React, { useState, useEffect } from 'react';
import {
  FileText,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Pill,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';

export default function MedicalSummaryView({ patientId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadSummary();
    }
  }, [patientId]);

  const loadSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSummary(patientId);
      setSummary(res.data);
    } catch (err) {
      console.error('Error fetching medical summary:', err);
      setError(err.message || 'Failed to load medical summary');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.regenerateSummary(patientId);
      setSummary(res.data);
    } catch (err) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Synthesizing comprehensive longitudinal medical summary...</p>
      </div>
    );
  }

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header Card */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <FileText size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Longitudinal Medical Summary</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Evidence-grounded narrative and clinical synthesis generated directly from all uploaded medical documents.
          </p>
        </div>

        <button
          onClick={handleRegenerate}
          disabled={regenerating}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
        >
          <RefreshCw size={15} className={regenerating ? 'spin' : ''} />
          <span>{regenerating ? 'Regenerating...' : 'Regenerate Summary'}</span>
        </button>
      </div>

      {summary && (
        <>
          {/* Period Covered & Evidence Scope */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Calendar size={22} style={{ color: 'var(--primary)' }} />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Period Covered</span>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                  {summary.periodCovered?.from ? new Date(summary.periodCovered.from).toLocaleDateString() : 'N/A'} —{' '}
                  {summary.periodCovered?.to ? new Date(summary.periodCovered.to).toLocaleDateString() : 'N/A'}
                </strong>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <Layers size={22} style={{ color: 'var(--accent)' }} />
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Documents Synthesized</span>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>
                  {summary.documentsConsidered?.length || 0} Medical Records
                </strong>
              </div>
            </div>
          </div>

          {/* Clinical Narrative Summary */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderLeft: '4px solid var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Synthesized Clinical Narrative</h3>
            </div>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
              {summary.narrativeSummary || 'No narrative text generated yet.'}
            </p>
          </div>

          {/* Documented Conditions with Exact Citations */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Documented Conditions & Evidence</h3>
            {summary.documentedConditions?.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
                {summary.documentedConditions.map((cond, idx) => (
                  <div key={idx} style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>
                      {cond.condition}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <strong>Citation:</strong> {cond.evidenceSnippet}
                    </div>
                    {cond.date && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
                        Documented Date: {new Date(cond.date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No conditions explicitly documented in scanned records.</p>
            )}
          </div>

          {/* Key Observations Table (Latest vs Previous) */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Key Clinical Observations & Trajectory</h3>
            {summary.keyObservations?.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Marker</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Latest Value</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Previous Value</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Longitudinal Trajectory</th>
                      <th style={{ padding: '0.65rem 0.85rem' }}>Source Document</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.keyObservations.map((obs, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{obs.label}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{obs.latestValue}</td>
                        <td style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)' }}>{obs.previousValue || 'N/A'}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{obs.changeText}</td>
                        <td style={{ padding: '0.65rem 0.85rem', fontSize: '0.8rem', color: 'var(--text-subtle)' }}>{obs.sourceTitle}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No comparative observations available.</p>
            )}
          </div>

          {/* Active Medications & Documented Allergies */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Pill size={18} style={{ color: 'var(--primary)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Documented Medications</h3>
              </div>
              {summary.activeMedications?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {summary.activeMedications.map((med, idx) => (
                    <div key={idx} style={{ backgroundColor: 'var(--bg-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>{med.name} {med.dosage}</strong>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{med.frequency}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No medications active in record store.</p>
              )}
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={18} style={{ color: 'var(--warning)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Documented Allergies</h3>
              </div>
              {summary.recordedAllergies?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {summary.recordedAllergies.map((alg, idx) => (
                    <div key={idx} style={{ backgroundColor: '#fef3c7', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid #fde68a', color: '#92400e' }}>
                      <strong>{alg}</strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-subtle)', fontSize: '0.85rem' }}>No known allergies documented.</p>
              )}
            </div>
          </div>

          {/* Diagnostic Gaps & Missing Information Card */}
          {summary.dataGaps?.length > 0 && (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#fefce8', border: '1px solid #fef08a' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} style={{ color: '#ca8a04' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#854d0e' }}>Data Gaps & Untracked Clinical Areas</h3>
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.88rem', color: '#713f12', lineHeight: 1.6 }}>
                {summary.dataGaps.map((gap, idx) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary Disclaimer */}
          <div style={{ padding: '0.85rem 1rem', backgroundColor: 'var(--bg-muted)', borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
            <strong>Medical Notice:</strong> {summary.disclaimer}
          </div>
        </>
      )}
    </div>
  );
}
