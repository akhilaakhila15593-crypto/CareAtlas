import React, { useState, useEffect } from 'react';
import {
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  FileText,
  RefreshCw,
  Filter,
  Check,
  Edit,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

export default function DataConflictsView({ patientId, onRefresh }) {
  const [conflicts, setConflicts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);
  const [resolutionNotesMap, setResolutionNotesMap] = useState({});

  useEffect(() => {
    if (patientId) {
      loadConflicts();
    }
  }, [patientId, statusFilter]);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const res = await api.getConflicts(patientId, statusFilter);
      setConflicts(res.data || []);
    } catch (err) {
      console.error('Error fetching conflicts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (conflict, newStatus) => {
    setActionInProgress(conflict._id || conflict.conflictKey);
    try {
      const notes = resolutionNotesMap[conflict._id || conflict.conflictKey] || '';
      await api.updateConflict(patientId, conflict._id || conflict.conflictKey, {
        status: newStatus,
        resolutionNotes: notes || `Marked as ${newStatus} by clinician reviewer.`,
        reviewedBy: 'Clinician / User',
      });
      await loadConflicts();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const unresolvedCount = conflicts.filter((c) => c.status === 'unresolved').length;

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <GitMerge size={24} style={{ color: 'var(--warning)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Cross-Report Data Conflict Intelligence</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Automated detection of conflicting medications, contradictory lab results, and demographic discrepancies across records.
          </p>
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            {['All', 'unresolved', 'reviewed', 'corrected', 'not_a_conflict'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: statusFilter === st ? 'var(--bg-card)' : 'transparent',
                  color: statusFilter === st ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: statusFilter === st ? 'var(--shadow-sm)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {st.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Conflict Feed */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <RefreshCw size={30} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Analyzing cross-report discrepancies...</p>
        </div>
      ) : conflicts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <CheckCircle2 size={42} style={{ color: 'var(--accent)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--secondary)' }}>No Discrepancies Found</h3>
          <p style={{ color: 'var(--text-subtle)', maxWidth: '420px', margin: '0.5rem auto 0' }}>
            No records match the selected status filter "{statusFilter}". All documents show consistent medication, demographic, and laboratory values.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {conflicts.map((c) => {
            const isUnresolved = c.status === 'unresolved';
            const cId = c._id || c.conflictKey;

            return (
              <div
                key={cId}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: `4px solid ${
                    c.severity === 'Critical' || c.severity === 'High' ? 'var(--danger)' : 'var(--warning)'
                  }`,
                }}
              >
                {/* Conflict Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                        {c.category} Discrepancy
                      </span>
                      <span
                        className={`badge ${
                          c.severity === 'Critical' || c.severity === 'High' ? 'badge-danger' : 'badge-neutral'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {c.severity} Severity
                      </span>
                      <span className={`badge ${isUnresolved ? 'badge-warning' : 'badge-success'}`} style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>
                        Status: {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      Conflict in {c.field}
                    </h3>
                  </div>

                  {c.reviewedAt && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                      Reviewed by {c.reviewedBy} on {new Date(c.reviewedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                {/* Explanation */}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {c.explanation}
                </p>

                {/* Side-by-Side Sources A and B */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', backgroundColor: 'var(--bg-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  {/* Source A */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SOURCE A RECORD
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                      {c.sourceA?.title || 'Report A'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Date: {c.sourceA?.date ? new Date(c.sourceA.date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: 700, color: 'var(--danger)', marginTop: '0.25rem' }}>
                      Documented Value: {c.sourceA?.value}
                    </div>
                  </div>

                  {/* Source B */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      SOURCE B RECORD
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                      {c.sourceB?.title || 'Report B'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Date: {c.sourceB?.date ? new Date(c.sourceB.date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontWeight: 700, color: 'var(--primary)', marginTop: '0.25rem' }}>
                      Documented Value: {c.sourceB?.value}
                    </div>
                  </div>
                </div>

                {/* Recommended Clinical Action */}
                {c.recommendedAction && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Info size={16} style={{ color: 'var(--primary)', flexShrink: 0 }} />
                    <span><strong>Recommendation:</strong> {c.recommendedAction}</span>
                  </div>
                )}

                {/* Resolution Workflow Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Resolve Discrepancy:
                    </span>
                    <button
                      onClick={() => handleUpdateStatus(c, 'reviewed')}
                      disabled={actionInProgress === cId}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Mark as Reviewed
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c, 'corrected')}
                      disabled={actionInProgress === cId}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Mark as Corrected
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(c, 'not_a_conflict')}
                      disabled={actionInProgress === cId}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.78rem' }}
                    >
                      Not a Conflict (Intentional)
                    </button>
                  </div>

                  {c.resolutionNotes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', backgroundColor: 'var(--bg-muted)', padding: '0.45rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                      Audit Resolution Notes: {c.resolutionNotes}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
