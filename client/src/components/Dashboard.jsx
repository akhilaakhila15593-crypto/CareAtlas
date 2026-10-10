import React from 'react';
import {
  FileText,
  Activity,
  Calendar,
  Layers,
  Heart,
  Droplet,
  Thermometer,
  ShieldAlert,
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  FileSearch,
  Pill,
  GitMerge,
  Bell,
  Share2,
  ShieldCheck,
  History,
} from 'lucide-react';
import TrendChart from './TrendChart';

export default function Dashboard({
  dashboardData,
  loading,
  error,
  onNavigate,
}) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem',
          }}
        />
        <p style={{ color: 'var(--text-muted)' }}>Loading patient health overview...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#fef2f2' }}>
        <ShieldAlert size={36} color="var(--danger)" style={{ margin: '0 auto 0.75rem' }} />
        <h3 style={{ color: 'var(--danger)', fontWeight: 700 }}>Unable to load patient records</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          {error || 'Patient dashboard data is currently unavailable.'}
        </p>
      </div>
    );
  }

  const { patient, summary, latestMetrics = [], trendSeries = [], timeline = [] } = dashboardData;

  const getMetricIcon = (key) => {
    switch (key) {
      case 'glucose':
      case 'glucose_postprandial':
      case 'hba1c':
        return <Droplet size={18} color="#0284c7" />;
      case 'bp_systolic':
      case 'bp_diastolic':
      case 'heart_rate':
        return <Heart size={18} color="#e11d48" />;
      case 'temperature':
        return <Thermometer size={18} color="#ea580c" />;
      default:
        return <Activity size={18} color="#059669" />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Patient Identity Banner */}
      <div className="patient-id-card">
        <div className="patient-info-left">
          <div className="patient-avatar">
            {patient.name.charAt(0)}
          </div>
          <div className="patient-details">
            <h2>
              {patient.name}
              <span className="badge badge-synthetic">Synthetic Demo Profile</span>
            </h2>
            <div className="patient-meta">
              <span><strong>ID:</strong> {patient.demoId}</span>
              <span>•</span>
              <span><strong>DOB:</strong> {patient.dateOfBirth || '1967-04-12'}</span>
              <span>•</span>
              <span><strong>Age:</strong> {patient.age} years</span>
              <span>•</span>
              <span><strong>Sex:</strong> {patient.sex}</span>
            </div>
            {patient.notes && (
              <p className="patient-notes">
                <strong>Clinical Notes:</strong> {patient.notes}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => onNavigate('records')} className="btn btn-primary btn-sm">
            <FileText size={15} /> Upload / View Records
          </button>
          <button
            onClick={() => onNavigate('chat')}
            className="btn btn-sm"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            <Sparkles size={15} /> Ask Health Copilot
          </button>
        </div>
      </div>

      {/* Summary Stat Boxes */}
      <div className="grid-4">
        <div className="stat-box" onClick={() => onNavigate('records')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
            <FileText size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.totalRecords}</div>
            <div className="stat-label">Total Documents</div>
          </div>
        </div>

        <div className="stat-box" onClick={() => onNavigate('trends')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
            <Activity size={22} />
          </div>
          <div>
            <div className="stat-value">{summary.totalMeasurements}</div>
            <div className="stat-label">Captured Values</div>
          </div>
        </div>

        <div className="stat-box" onClick={() => onNavigate('records')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
            <Calendar size={22} />
          </div>
          <div>
            <div className="stat-value" style={{ fontSize: '1.1rem' }}>
              {summary.newestRecordDate
                ? new Date(summary.newestRecordDate).toISOString().split('T')[0]
                : 'None'}
            </div>
            <div className="stat-label">Newest Record Date</div>
          </div>
        </div>

        <div className="stat-box" onClick={() => onNavigate('records')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ backgroundColor: '#ede9fe', color: '#7c3aed' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">
              {Object.keys(summary.categoryCounts || {}).length}
            </div>
            <div className="stat-label">Doc Categories</div>
          </div>
        </div>
      </div>

      {/* Clinical Intelligence Quick-Access Grid */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--secondary)' }}>
            Clinical Intelligence & Investigation Modules
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>12 connected modules active</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.85rem' }}>
          <div
            onClick={() => onNavigate('trends')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: 'var(--primary)' }}>
              <TrendingUp size={17} /> Health Trends & Compare
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Time windows, delta percentage points calculation, and side-by-side report comparison.
            </span>
          </div>

          <div
            onClick={() => onNavigate('investigate')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#0369a1' }}>
              <FileSearch size={17} /> Document Intelligence
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Split-pane original document text vs extracted clinical facts with inline calibration.
            </span>
          </div>

          <div
            onClick={() => onNavigate('conflicts')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#b45309' }}>
              <GitMerge size={17} /> Cross-Report Conflicts
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Metformin dosage conflicts (500mg vs 1000mg) and resolution workflow.
            </span>
          </div>

          <div
            onClick={() => onNavigate('medications')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#059669' }}>
              <Pill size={17} /> Medication Safety
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Reconciliation, Lisinopril + Spironolactone interaction, and duplicate therapies.
            </span>
          </div>

          <div
            onClick={() => onNavigate('alerts')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#dc2626' }}>
              <Bell size={17} /> Clinical Alerts Feed
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Explainable abnormal lab triggers with acknowledge/dismiss actions.
            </span>
          </div>

          <div
            onClick={() => onNavigate('summary')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#4338ca' }}>
              <FileText size={17} /> Clinical Summary
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Synthesized narrative, period covered, conditions, and untracked diagnostic gaps.
            </span>
          </div>

          <div
            onClick={() => onNavigate('timeline')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#6d28d9' }}>
              <History size={17} /> Longitudinal Timeline
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Chronological flow across all encounters, abnormal labs, and prescriptions.
            </span>
          </div>

          <div
            onClick={() => onNavigate('privacy')}
            style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, color: '#0f172a' }}>
              <Share2 size={17} /> FHIR R4 & Audit Logs
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Export HL7 FHIR Bundle, CSV, JSON snapshot, and inspect immutable audit trail.
            </span>
          </div>
        </div>
      </div>

      {/* Latest Values by Metric Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="var(--primary)" />
            Latest Recorded Lab & Vital Values
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Showing most recent dated observation for each metric
          </span>
        </div>

        {latestMetrics.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--text-muted)' }}>No structured measurements captured yet. Upload a lab report or clinical visit note.</p>
          </div>
        ) : (
          <div className="grid-3">
            {latestMetrics.map((metric, idx) => (
              <div key={idx} className="metric-card">
                <div className="metric-card-header">
                  <span className="metric-card-label">{metric.label}</span>
                  <div style={{ padding: '0.25rem', backgroundColor: '#f1f5f9', borderRadius: '50%' }}>
                    {getMetricIcon(metric.key)}
                  </div>
                </div>

                <div className="metric-card-value">
                  {metric.rawValue}
                </div>

                <div className="metric-card-footer">
                  <span>Ref: {metric.referenceRange || 'Standard'}</span>
                  <span>
                    {metric.documentDate
                      ? new Date(metric.documentDate).toISOString().split('T')[0]
                      : 'Date unconfirmed'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Interactive Chronological Trend Visualizer */}
      <div>
        <TrendChart trendSeries={trendSeries} />
      </div>

      {/* Recent Document Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Clock size={20} color="var(--primary)" />
            Recent Document Timeline
          </h3>
          <button onClick={() => onNavigate('records')} className="btn btn-outline btn-sm">
            View All Records <ArrowRight size={14} />
          </button>
        </div>

        {timeline.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem' }}>
            No records stored yet for this patient.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {timeline.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.85rem 1rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'white',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--primary)',
                    }}
                  >
                    <FileText size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                      {item.title}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {item.documentType}
                      </span>
                      <span>•</span>
                      <span>
                        Date:{' '}
                        <strong>
                          {item.documentDate
                            ? new Date(item.documentDate).toISOString().split('T')[0]
                            : 'Unconfirmed'}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {item.measurementsCount > 0 && (
                    <span className="badge badge-success">
                      {item.measurementsCount} value(s) captured
                    </span>
                  )}
                  <span
                    className="badge"
                    style={{
                      backgroundColor:
                        item.extractionConfidence === 'high'
                          ? '#dcfce7'
                          : item.extractionConfidence === 'medium'
                          ? '#fef3c7'
                          : '#f1f5f9',
                      color:
                        item.extractionConfidence === 'high'
                          ? '#166534'
                          : item.extractionConfidence === 'medium'
                          ? '#854d0e'
                          : '#64748b',
                    }}
                  >
                    Confidence: {item.extractionConfidence}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
