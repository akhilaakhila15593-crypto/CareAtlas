import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Layers,
  ArrowRight,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  RefreshCw,
  GitCompare,
} from 'lucide-react';
import { api } from '../services/api';
import TrendChart from './TrendChart';

export default function HealthTrends({ patientId, reports = [] }) {
  const [timeWindow, setTimeWindow] = useState('all');
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Report comparison state
  const [reportAId, setReportAId] = useState('');
  const [reportBId, setReportBId] = useState('');
  const [comparisonResult, setComparisonResult] = useState(null);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    if (patientId) {
      loadTrends();
    }
  }, [patientId, timeWindow]);

  useEffect(() => {
    // Default report comparison selections if reports available
    if (reports.length >= 2) {
      const dated = reports.filter((r) => r.documentDate);
      if (dated.length >= 2) {
        setReportAId(dated[dated.length - 1]._id); // Older
        setReportBId(dated[0]._id); // Newer
      } else {
        setReportAId(reports[reports.length - 1]._id);
        setReportBId(reports[0]._id);
      }
    }
  }, [reports]);

  useEffect(() => {
    if (reportAId && reportBId && reportAId !== reportBId) {
      runComparison(reportAId, reportBId);
    }
  }, [reportAId, reportBId]);

  const loadTrends = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getTrends(patientId, timeWindow);
      setTrendData(res.data?.trends || []);
    } catch (err) {
      console.error('Error fetching trends:', err);
      setError(err.message || 'Failed to load longitudinal trends');
    } finally {
      setLoading(false);
    }
  };

  const runComparison = async (idA, idB) => {
    setComparing(true);
    try {
      const res = await api.compareReports(patientId, idA, idB);
      setComparisonResult(res.data);
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setComparing(false);
    }
  };

  // Convert trends data for TrendChart component
  const chartSeries = trendData.map((t) => ({
    key: t.key,
    label: t.label,
    unit: t.unit,
    referenceRange: t.referenceRange,
    pointsCount: t.observationsCount,
    dataPoints: (t.observations || []).map((obs) => ({
      date: obs.date ? new Date(obs.date).toISOString().split('T')[0] : 'N/A',
      rawValue: obs.rawValue,
      numericValue: obs.numericValue,
      reportTitle: obs.sourceSnippet || 'Lab Observation',
      reportId: obs.reportId,
    })),
  }));

  return (
    <div className="section-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header & Filter Controls */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <TrendingUp size={22} style={{ color: 'var(--primary)' }} />
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Longitudinal Health Analysis</h2>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Chronological tracking of lab and vital observations across dated medical documents with mathematical delta precision.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Clock size={15} /> Time Window:
            </span>
            <div style={{ display: 'inline-flex', background: 'var(--bg-muted)', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              {[
                { key: '1m', label: '1M' },
                { key: '3m', label: '3M' },
                { key: '6m', label: '6M' },
                { key: '1y', label: '1Y' },
                { key: 'all', label: 'All Time' },
              ].map((w) => (
                <button
                  key={w.key}
                  onClick={() => setTimeWindow(w.key)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: timeWindow === w.key ? 'var(--bg-card)' : 'transparent',
                    color: timeWindow === w.key ? 'var(--primary)' : 'var(--text-muted)',
                    boxShadow: timeWindow === w.key ? 'var(--shadow-sm)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <button
              onClick={loadTrends}
              className="btn btn-outline btn-sm"
              title="Refresh trends"
              style={{ padding: '0.45rem' }}
            >
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </div>

        {/* Informative Precision Alert */}
        <div style={{ backgroundColor: 'var(--primary-light)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid #bae6fd', fontSize: '0.85rem', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Clinical Precision Protocol:</strong> Percentage metrics (such as HbA1c from 8.6% to 7.2%) are reported strictly as <strong>percentage points change</strong> (decrease of 1.4 percentage points) rather than relative percent reduction.
          </span>
        </div>
      </div>

      {/* Main Trends Visualizer */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Analyzing longitudinal records and time windows...</p>
        </div>
      ) : chartSeries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Layers size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No Multi-Date Trends in Selected Window</h3>
          <p style={{ color: 'var(--text-subtle)', maxWidth: '420px', margin: '0.5rem auto 0' }}>
            No matching longitudinal observations found for window "{timeWindow.toUpperCase()}". Try switching to "All Time" or uploading an additional dated medical report.
          </p>
        </div>
      ) : (
        <>
          {/* SVG Trend Chart */}
          <TrendChart trendSeries={chartSeries} />

          {/* Metric Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {trendData.map((t) => {
              const deltaNum = t.deltaFromEarliest;
              const isNegative = deltaNum !== null && deltaNum < 0;
              const isPositive = deltaNum !== null && deltaNum > 0;
              const isPoints = t.unit === '%';

              return (
                <div key={t.key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>{t.label}</h4>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Standard Reference: {t.referenceRange || 'Standard reference'}
                      </span>
                    </div>
                    <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                      {t.observationsCount} points
                    </span>
                  </div>

                  {/* Earliest vs Latest Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-muted)', padding: '0.85rem', borderRadius: 'var(--radius-md)' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>EARLIEST</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {t.earliest?.rawValue || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {t.earliest?.date ? new Date(t.earliest.date).toISOString().split('T')[0] : 'N/A'}
                      </div>
                    </div>

                    <ArrowRight size={18} style={{ color: 'var(--text-subtle)' }} />

                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>LATEST</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--primary)' }}>
                        {t.latest?.rawValue || 'N/A'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                        {t.latest?.date ? new Date(t.latest.date).toISOString().split('T')[0] : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Change Indicator */}
                  {deltaNum !== null && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Net Longitudinal Change:</span>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: isNegative ? 'var(--accent)' : isPositive ? 'var(--danger)' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {isNegative ? <TrendingDown size={15} /> : isPositive ? <TrendingUp size={15} /> : <Minus size={15} />}
                        {isPoints ? (
                          <span>
                            {Math.abs(deltaNum).toFixed(1)} percentage points {deltaNum < 0 ? 'decrease' : 'increase'}
                          </span>
                        ) : (
                          <span>
                            {deltaNum > 0 ? `+${deltaNum}` : deltaNum} {t.unit}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Report-to-Report Cross Comparison Tool */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <GitCompare size={22} style={{ color: 'var(--primary)' }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Direct Cross-Report Comparison</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Select any two dated documents to perform automated side-by-side metric comparison and variance analysis.
            </p>
          </div>
        </div>

        {/* Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Base Document (Report A):
            </label>
            <select
              value={reportAId}
              onChange={(e) => setReportAId(e.target.value)}
              className="select-input"
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              {reports.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.originalFilename} ({r.documentDate ? new Date(r.documentDate).toISOString().split('T')[0] : 'Undated'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              Comparison Document (Report B):
            </label>
            <select
              value={reportBId}
              onChange={(e) => setReportBId(e.target.value)}
              className="select-input"
              style={{ width: '100%', padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
            >
              {reports.map((r) => (
                <option key={r._id} value={r._id}>
                  {r.originalFilename} ({r.documentDate ? new Date(r.documentDate).toISOString().split('T')[0] : 'Undated'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison Table */}
        {comparing ? (
          <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={20} className="spin" style={{ margin: '0 auto 0.5rem' }} />
            <span>Comparing measurements...</span>
          </div>
        ) : comparisonResult && comparisonResult.comparisonRows?.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', fontSize: '0.88rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-muted)', textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Laboratory / Vital Metric</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{comparisonResult.reportA.title}</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>{comparisonResult.reportB.title}</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Variance / Difference</th>
                </tr>
              </thead>
              <tbody>
                {comparisonResult.comparisonRows.map((row) => {
                  const isHbA1c = row.metricKey === 'hba1c';
                  const hasPoints = row.percentagePointsDelta !== null;
                  const deltaVal = hasPoints ? row.percentagePointsDelta : row.numericalDelta;
                  const isReduced = deltaVal !== null && deltaVal < 0;

                  return (
                    <tr key={row.metricKey} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>
                        {row.metricLabel}
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                          Ref: {row.referenceRange || 'Standard'}
                        </span>
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        {row.reportAValue ? (
                          <span style={{ fontWeight: 600 }}>{row.reportAValue.rawValue}</span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>Not present</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        {row.reportBValue ? (
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.reportBValue.rawValue}</span>
                        ) : (
                          <span style={{ color: 'var(--text-subtle)' }}>Not present</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.85rem' }}>
                        {row.status === 'both_present' ? (
                          isHbA1c ? (
                            <span
                              style={{
                                color: isReduced ? 'var(--accent)' : 'var(--danger)',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                              }}
                            >
                              {isReduced ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                              {Math.abs(row.percentagePointsDelta).toFixed(1)} percentage points {isReduced ? 'decrease' : 'increase'}
                            </span>
                          ) : (
                            <span
                              style={{
                                color: isReduced ? 'var(--accent)' : 'var(--text-main)',
                                fontWeight: 700,
                              }}
                            >
                              {deltaVal > 0 ? `+${deltaVal}` : deltaVal} {row.unit}
                            </span>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                            Single document observation
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', textAlign: 'center' }}>
            Select two different documents to view side-by-side metric comparison.
          </div>
        )}
      </div>
    </div>
  );
}
