import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  Activity,
  Pill,
  Calendar,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { api } from '../services/api';

export default function PatientHistoryTimeline({ patientId }) {
  const [events, setEvents] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadHistory();
    }
  }, [patientId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getPatientHistory(patientId);
      setEvents(res.data || []);
    } catch (err) {
      console.error('Error fetching patient history:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter((e) => {
    if (filterType === 'all') return true;
    return e.type === filterType;
  });

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <Clock size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Longitudinal Patient History Timeline</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Complete unified chronological timeline across medical encounters, laboratory measurements, and medication prescriptions.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
          {[
            { key: 'all', label: 'All Events' },
            { key: 'document', label: 'Documents' },
            { key: 'measurement', label: 'Labs & Vitals' },
            { key: 'medication', label: 'Prescriptions' },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterType(f.key)}
              style={{
                padding: '0.35rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: filterType === f.key ? 'var(--bg-card)' : 'transparent',
                color: filterType === f.key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: filterType === f.key ? 'var(--shadow-sm)' : 'none',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <RefreshCw size={30} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Building chronological patient history...</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
          <Clock size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No Events Found</h3>
          <p style={{ color: 'var(--text-subtle)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
            No recorded medical events match the selected filter.
          </p>
        </div>
      ) : (
        <div style={{ position: 'relative', paddingLeft: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Vertical line indicator */}
          <div
            style={{
              position: 'absolute',
              left: '9px',
              top: '10px',
              bottom: '10px',
              width: '2px',
              backgroundColor: 'var(--border)',
            }}
          />

          {filteredEvents.map((evt) => {
            const isDoc = evt.type === 'document';
            const isMeas = evt.type === 'measurement';
            const isMed = evt.type === 'medication';

            return (
              <div key={evt.id} style={{ position: 'relative' }}>
                {/* Timeline node circle */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-2rem',
                    top: '12px',
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: isDoc ? 'var(--primary)' : isMeas ? 'var(--danger)' : 'var(--accent)',
                    border: '3px solid var(--bg-card)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                />

                <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isDoc && <FileText size={17} style={{ color: 'var(--primary)' }} />}
                      {isMeas && <Activity size={17} style={{ color: 'var(--danger)' }} />}
                      {isMed && <Pill size={17} style={{ color: 'var(--accent)' }} />}
                      <h4 style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--secondary)' }}>
                        {evt.title}
                      </h4>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                        {evt.documentType || 'Clinical Event'}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} />
                        {evt.date ? new Date(evt.date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', margin: 0, lineHeight: 1.5 }}>
                    {evt.summary}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
