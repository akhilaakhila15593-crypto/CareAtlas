import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  RefreshCw,
  Info,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

export default function HealthAlertsView({ patientId, onRefresh }) {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(null);

  useEffect(() => {
    if (patientId) {
      loadAlerts();
    }
  }, [patientId, statusFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.getAlerts(patientId, statusFilter);
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching health alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertItem) => {
    const aId = alertItem._id || alertItem.alertKey;
    setActionInProgress(aId);
    try {
      await api.updateAlert(patientId, aId, {
        status: 'acknowledged',
      });
      await loadAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Acknowledge failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDismiss = async (alertItem) => {
    const reason = window.prompt('Enter optional clinical reason for dismissing this alert:');
    if (reason === null) return; // user cancelled

    const aId = alertItem._id || alertItem.alertKey;
    setActionInProgress(aId);
    try {
      await api.updateAlert(patientId, aId, {
        status: 'dismissed',
        dismissReason: reason || 'Dismissed by user during clinical review.',
      });
      await loadAlerts();
      if (onRefresh) onRefresh();
    } catch (err) {
      alert(`Dismiss failed: ${err.message}`);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Bell size={24} style={{ color: 'var(--danger)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Explainable Health Alerts & Reminders</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Document-grounded clinical alerts with explicit evidence chains, clinical recommendations, and acknowledgment workflows.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {['active', 'acknowledged', 'dismissed', 'All'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: statusFilter === st ? 'var(--bg-card)' : 'transparent',
                color: statusFilter === st ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: statusFilter === st ? 'var(--shadow-sm)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <RefreshCw size={30} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Evaluating clinical alert triggers against patient evidence...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <CheckCircle2 size={42} style={{ color: 'var(--accent)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 700, color: 'var(--secondary)' }}>No {statusFilter !== 'All' ? statusFilter : ''} Alerts</h3>
          <p style={{ color: 'var(--text-subtle)', maxWidth: '420px', margin: '0.5rem auto 0' }}>
            There are no clinical alerts matching this filter criteria.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {alerts.map((a) => {
            const aId = a._id || a.alertKey;
            const isUrgent = a.priority === 'Urgent review';
            const isActive = a.status === 'active';

            return (
              <div
                key={aId}
                className="card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderLeft: `4px solid ${
                    isUrgent ? 'var(--danger)' : a.priority === 'Important' ? 'var(--warning)' : 'var(--primary)'
                  }`,
                }}
              >
                {/* Header line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span
                        className={`badge ${
                          isUrgent ? 'badge-danger' : a.priority === 'Important' ? 'badge-warning' : 'badge-neutral'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {a.priority}
                      </span>
                      <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                        {a.category}
                      </span>
                      <span
                        className={`badge ${
                          a.status === 'active' ? 'badge-warning' : a.status === 'acknowledged' ? 'badge-success' : 'badge-neutral'
                        }`}
                        style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}
                      >
                        {a.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
                      {a.title}
                    </h3>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                    {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : 'Active'}
                  </span>
                </div>

                {/* Clinical Explanation */}
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                  {a.explanation}
                </p>

                {/* Evidence & Provenance */}
                {a.triggeringEvidence && (
                  <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', border: '1px solid var(--border)' }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Triggering Record Evidence: </strong>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--secondary)' }}>"{a.triggeringEvidence}"</span>
                  </div>
                )}

                {/* Recommended Action */}
                {a.recommendedAction && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', backgroundColor: 'var(--primary-light)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <Info size={16} style={{ flexShrink: 0 }} />
                    <span><strong>Recommended Action: </strong>{a.recommendedAction}</span>
                  </div>
                )}

                {/* Actions: Acknowledge & Dismiss */}
                {isActive && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <button
                      onClick={() => handleDismiss(a)}
                      disabled={actionInProgress === aId}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}
                    >
                      Dismiss Alert
                    </button>
                    <button
                      onClick={() => handleAcknowledge(a)}
                      disabled={actionInProgress === aId}
                      className="btn btn-primary btn-sm"
                      style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <CheckCircle2 size={14} /> Acknowledge Alert
                    </button>
                  </div>
                )}

                {a.dismissReason && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Dismissal note: {a.dismissReason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
