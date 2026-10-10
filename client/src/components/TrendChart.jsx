import React, { useState } from 'react';
import { TrendingUp, Calendar, FileText, Info } from 'lucide-react';

export default function TrendChart({ trendSeries = [] }) {
  const [selectedKey, setSelectedKey] = useState(
    trendSeries.length > 0 ? trendSeries[0].key : ''
  );
  const [activePoint, setActivePoint] = useState(null);

  if (!trendSeries || trendSeries.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
        <TrendingUp size={40} style={{ color: 'var(--text-subtle)', margin: '0 auto 0.75rem' }} />
        <h4 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No Multi-Date Trends Yet</h4>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-subtle)', maxWidth: '400px', margin: '0.5rem auto 0' }}>
          When 2 or more dated reports with matching metrics (e.g. HbA1c, Glucose, Blood Pressure, LDL) are captured,
          an interactive chronological trend chart will appear here automatically.
        </p>
      </div>
    );
  }

  const currentSeries =
    trendSeries.find((s) => s.key === selectedKey) || trendSeries[0];
  const points = currentSeries.dataPoints || [];

  // Calculate SVG chart coordinates
  const svgWidth = 650;
  const svgHeight = 240;
  const paddingX = 60;
  const paddingY = 40;

  const numericVals = points
    .map((p) => p.numericValue)
    .filter((v) => typeof v === 'number' && !isNaN(v));

  const minVal = Math.min(...numericVals);
  const maxVal = Math.max(...numericVals);
  const range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
  const valBuffer = range * 0.2;
  const yMin = Math.max(0, minVal - valBuffer);
  const yMax = maxVal + valBuffer;

  const getX = (index) => {
    if (points.length <= 1) return svgWidth / 2;
    return paddingX + (index / (points.length - 1)) * (svgWidth - paddingX * 2);
  };

  const getY = (val) => {
    return svgHeight - paddingY - ((val - yMin) / (yMax - yMin)) * (svgHeight - paddingY * 2);
  };

  const pathD = points
    .map((p, idx) => {
      const x = getX(idx);
      const y = getY(p.numericValue);
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Compute numerical delta between first and latest
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const delta = (lastPoint.numericValue - firstPoint.numericValue).toFixed(2);
  const deltaSign = Number(delta) > 0 ? `+${delta}` : `${delta}`;

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 className="card-title">
            <TrendingUp size={20} color="var(--primary)" />
            Chronological Measurement Trends
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Comparing recorded observations across dated medical documents
          </p>
        </div>

        {/* Metric Selector Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Metric:</label>
          <select
            value={currentSeries.key}
            onChange={(e) => {
              setSelectedKey(e.target.value);
              setActivePoint(null);
            }}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'white',
              fontWeight: 600,
              color: 'var(--primary-dark)',
              cursor: 'pointer',
            }}
          >
            {trendSeries.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label} ({s.pointsCount} points)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Numerical Change Summary Ribbon */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 1rem',
          marginBottom: '1rem',
          fontSize: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Reference Range: </span>
          <strong style={{ color: 'var(--secondary)' }}>{currentSeries.referenceRange || 'Standard lab reference'}</strong>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>Baseline ({firstPoint.date}): </span>
          <strong>{firstPoint.rawValue}</strong>
          <span style={{ margin: '0 0.5rem', color: 'var(--text-subtle)' }}>➔</span>
          <span style={{ color: 'var(--text-muted)' }}>Latest ({lastPoint.date}): </span>
          <strong>{lastPoint.rawValue}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Net Numeric Delta: </span>
          <span
            className="badge"
            style={{
              backgroundColor: Number(delta) === 0 ? '#f1f5f9' : '#e0f2fe',
              color: 'var(--primary-dark)',
              fontSize: '0.85rem',
            }}
          >
            {deltaSign} {currentSeries.unit}
          </span>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: 'auto', minWidth: '480px', display: 'block' }}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = paddingY + pct * (svgHeight - paddingY * 2);
            const valLabel = (yMax - pct * (yMax - yMin)).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#94a3b8"
                  fontFamily="Inter, sans-serif"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Trend Line */}
          <path
            d={pathD}
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Area under curve */}
          {points.length > 1 && (
            <path
              d={`${pathD} L ${getX(points.length - 1)} ${svgHeight - paddingY} L ${getX(0)} ${svgHeight - paddingY} Z`}
              fill="rgba(2, 132, 199, 0.08)"
            />
          )}

          {/* Data Points */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.numericValue);
            const isHovered = activePoint === idx;

            return (
              <g
                key={idx}
                onMouseEnter={() => setActivePoint(idx)}
                onMouseLeave={() => setActivePoint(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Outer ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 8 : 6}
                  fill="white"
                  stroke="var(--primary)"
                  strokeWidth="3"
                />
                {/* Inner dot */}
                <circle cx={cx} cy={cy} r="3" fill="var(--primary)" />

                {/* Date Label on X Axis */}
                <text
                  x={cx}
                  y={svgHeight - 12}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#64748b"
                  fontFamily="Inter, sans-serif"
                >
                  {p.date}
                </text>

                {/* Value label above point */}
                <text
                  x={cx}
                  y={cy - 12}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="var(--secondary)"
                  fontFamily="Inter, sans-serif"
                >
                  {p.numericValue}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Details */}
        {activePoint !== null && points[activePoint] && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              background: 'rgba(15, 23, 42, 0.95)',
              color: 'white',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.8rem',
              boxShadow: 'var(--shadow-lg)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.2rem' }}>
              {points[activePoint].rawValue}
            </div>
            <div style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={13} /> Date: {points[activePoint].date}
            </div>
            <div style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <FileText size={13} /> Source: {points[activePoint].reportTitle}
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-muted)',
        }}
      >
        <Info size={14} style={{ flexShrink: 0, color: 'var(--text-subtle)' }} />
        <span>
          <strong>Clinical Neutrality Policy:</strong> Changes are reported strictly as chronological numerical differences.
          They are not labeled as improved or worsened without validated clinical context from your attending physician.
        </span>
      </div>
    </div>
  );
}
