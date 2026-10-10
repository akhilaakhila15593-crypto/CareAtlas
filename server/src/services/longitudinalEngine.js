/**
 * CareAtlas Longitudinal Health Analysis Engine
 *
 * Computes chronological health trends, delta calculations, percentage points for %,
 * time-window filtering, and cross-report comparisons.
 */

/**
 * Filter measurements by time window (1M, 3M, 6M, 1Y, all, or custom).
 */
function filterByTimeWindow(measurements, windowType = 'all', customStart = null, customEnd = null) {
  if (!Array.isArray(measurements) || measurements.length === 0) return [];
  if (windowType === 'all') return [...measurements];

  const now = new Date();
  let cutoffDate = new Date();

  switch (windowType) {
    case '1m':
      cutoffDate.setMonth(now.getMonth() - 1);
      break;
    case '3m':
      cutoffDate.setMonth(now.getMonth() - 3);
      break;
    case '6m':
      cutoffDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      cutoffDate.setFullYear(now.getFullYear() - 1);
      break;
    case 'custom':
      const start = customStart ? new Date(customStart) : new Date(0);
      const end = customEnd ? new Date(customEnd) : now;
      return measurements.filter((m) => {
        const d = m.date ? new Date(m.date) : null;
        return d && d >= start && d <= end;
      });
    default:
      return [...measurements];
  }

  return measurements.filter((m) => {
    const d = m.date ? new Date(m.date) : null;
    return d && d >= cutoffDate;
  });
}

/**
 * Computes longitudinal trend statistics for each metric.
 *
 * @param {Array} reports - Patient's reports
 * @param {string} windowType - '1m' | '3m' | '6m' | '1y' | 'all' | 'custom'
 * @param {string} customStart - optional ISO date
 * @param {string} customEnd - optional ISO date
 */
function analyzeLongitudinalTrends(reports = [], windowType = 'all', customStart = null, customEnd = null) {
  const metricGroups = {};

  reports.forEach((r) => {
    (r.measurements || []).forEach((m) => {
      if (m.numericValue !== null && !isNaN(m.numericValue)) {
        if (!metricGroups[m.key]) {
          metricGroups[m.key] = [];
        }
        metricGroups[m.key].push({
          ...m,
          reportId: r._id,
          reportTitle: r.originalFilename,
          documentDate: m.date || r.documentDate,
          sourceSnippet: m.sourceSnippet || r.originalFilename,
        });
      }
    });
  });

  const trends = [];

  Object.entries(metricGroups).forEach(([key, items]) => {
    // Sort ascending chronologically
    items.sort((a, b) => {
      const dA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
      const dB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
      return dA - dB;
    });

    // Apply time-window filter
    const filteredItems = filterByTimeWindow(items, windowType, customStart, customEnd);
    if (filteredItems.length === 0) return;

    const earliest = filteredItems[0];
    const latest = filteredItems[filteredItems.length - 1];
    const previous = filteredItems.length >= 2 ? filteredItems[filteredItems.length - 2] : null;

    const diffFromEarliest = (latest.numericValue - earliest.numericValue).toFixed(2);
    const diffFromPrevious = previous ? (latest.numericValue - previous.numericValue).toFixed(2) : '0.00';

    // Calculate percentage change AND percentage points for percentage metrics (e.g. HbA1c)
    let percentChangeFromEarliest = null;
    let percentagePointsDelta = null;
    let isPercentageMetric = latest.unit === '%';

    if (isPercentageMetric) {
      // For %, the absolute difference is described in "percentage points"
      percentagePointsDelta = Number(diffFromEarliest);
      // Relative change
      if (earliest.numericValue !== 0) {
        percentChangeFromEarliest = Number((((latest.numericValue - earliest.numericValue) / earliest.numericValue) * 100).toFixed(2));
      }
    } else if (earliest.numericValue !== 0) {
      percentChangeFromEarliest = Number((((latest.numericValue - earliest.numericValue) / earliest.numericValue) * 100).toFixed(2));
    }

    // Direction classification
    let trajectory = 'stable';
    const numDiff = Number(diffFromEarliest);
    if (filteredItems.length < 2) trajectory = 'insufficient_measurements';
    else if (numDiff > 0.05) trajectory = 'increasing';
    else if (numDiff < -0.05) trajectory = 'decreasing';

    trends.push({
      key,
      label: latest.label || key,
      unit: latest.unit || '',
      referenceRange: latest.referenceRange || '',
      totalObservations: filteredItems.length,
      trajectory,
      earliest: {
        value: earliest.rawValue,
        numericValue: earliest.numericValue,
        date: earliest.documentDate ? new Date(earliest.documentDate).toISOString().split('T')[0] : 'N/A',
        reportTitle: earliest.reportTitle,
        reportId: earliest.reportId,
      },
      latest: {
        value: latest.rawValue,
        numericValue: latest.numericValue,
        date: latest.documentDate ? new Date(latest.documentDate).toISOString().split('T')[0] : 'N/A',
        reportTitle: latest.reportTitle,
        reportId: latest.reportId,
      },
      previous: previous
        ? {
            value: previous.rawValue,
            numericValue: previous.numericValue,
            date: previous.documentDate ? new Date(previous.documentDate).toISOString().split('T')[0] : 'N/A',
            reportTitle: previous.reportTitle,
            reportId: previous.reportId,
          }
        : null,
      numericalDifference: Number(diffFromEarliest),
      diffFromPrevious: Number(diffFromPrevious),
      isPercentageMetric,
      percentagePointsDelta,
      percentChange: percentChangeFromEarliest,
      calculationExplanation: isPercentageMetric
        ? `Change from ${earliest.numericValue}% (${earliest.documentDate ? new Date(earliest.documentDate).toISOString().split('T')[0] : 'N/A'}) to ${latest.numericValue}% (${latest.documentDate ? new Date(latest.documentDate).toISOString().split('T')[0] : 'N/A'}) represents a difference of ${percentagePointsDelta > 0 ? '+' : ''}${percentagePointsDelta} percentage points (relative change: ${percentChangeFromEarliest}%).`
        : `Numeric change from ${earliest.numericValue} ${earliest.unit} to ${latest.numericValue} ${latest.unit} represents a difference of ${Number(diffFromEarliest) > 0 ? '+' : ''}${diffFromEarliest} ${latest.unit} (${percentChangeFromEarliest ? `${percentChangeFromEarliest}%` : 'N/A'}).`,
      dataPoints: filteredItems.map((item) => ({
        date: item.documentDate ? new Date(item.documentDate).toISOString().split('T')[0] : 'N/A',
        rawValue: item.rawValue,
        numericValue: item.numericValue,
        unit: item.unit,
        reportTitle: item.reportTitle,
        reportId: item.reportId,
        sourceSnippet: item.sourceSnippet,
      })),
      limitationNotice:
        'Described strictly as chronological numeric change. Clinical significance depends on diagnostic context and attending physician evaluation.',
    });
  });

  return trends;
}

/**
 * Compares any two specific reports side-by-side.
 *
 * @param {object} reportA
 * @param {object} reportB
 * @returns {object} Detailed report-to-report comparison table
 */
function compareTwoReports(reportA, reportB) {
  if (!reportA || !reportB) {
    throw new Error('Both report A and report B are required for comparison');
  }

  const measurementsA = reportA.measurements || [];
  const measurementsB = reportB.measurements || [];

  const mapA = new Map(measurementsA.map((m) => [m.key, m]));
  const mapB = new Map(measurementsB.map((m) => [m.key, m]));

  const allKeys = Array.from(new Set([...mapA.keys(), ...mapB.keys()]));
  const comparisonRows = [];

  allKeys.forEach((key) => {
    const itemA = mapA.get(key);
    const itemB = mapB.get(key);

    const label = (itemB || itemA).label || key;
    const unit = (itemB || itemA).unit || '';
    const refRange = (itemB || itemA).referenceRange || '';

    let delta = null;
    let percentagePointsDelta = null;
    let percentChange = null;
    let status = 'both_present';

    if (itemA && itemB) {
      if (itemA.numericValue !== null && itemB.numericValue !== null) {
        delta = Number((itemB.numericValue - itemA.numericValue).toFixed(2));
        if (unit === '%') {
          percentagePointsDelta = delta;
        }
        if (itemA.numericValue !== 0) {
          percentChange = Number((((itemB.numericValue - itemA.numericValue) / itemA.numericValue) * 100).toFixed(2));
        }
      }
    } else if (itemA && !itemB) {
      status = 'only_in_first';
    } else if (!itemA && itemB) {
      status = 'only_in_second';
    }

    comparisonRows.push({
      key,
      label,
      unit,
      referenceRange: refRange,
      status,
      reportA: itemA
        ? {
            rawValue: itemA.rawValue,
            numericValue: itemA.numericValue,
            date: reportA.documentDate ? new Date(reportA.documentDate).toISOString().split('T')[0] : 'N/A',
            sourceSnippet: itemA.sourceSnippet || reportA.originalFilename,
          }
        : null,
      reportB: itemB
        ? {
            rawValue: itemB.rawValue,
            numericValue: itemB.numericValue,
            date: reportB.documentDate ? new Date(reportB.documentDate).toISOString().split('T')[0] : 'N/A',
            sourceSnippet: itemB.sourceSnippet || reportB.originalFilename,
          }
        : null,
      numericalDelta: delta,
      percentagePointsDelta,
      percentChange,
    });
  });

  return {
    reportA: {
      id: reportA._id,
      title: reportA.originalFilename,
      documentType: reportA.documentType,
      date: reportA.documentDate ? new Date(reportA.documentDate).toISOString().split('T')[0] : 'N/A',
    },
    reportB: {
      id: reportB._id,
      title: reportB.originalFilename,
      documentType: reportB.documentType,
      date: reportB.documentDate ? new Date(reportB.documentDate).toISOString().split('T')[0] : 'N/A',
    },
    sharedMetricsCount: comparisonRows.filter((r) => r.status === 'both_present').length,
    comparisonRows,
  };
}

module.exports = {
  analyzeLongitudinalTrends,
  compareTwoReports,
  filterByTimeWindow,
};
