/**
 * CareAtlas Medical Data Validation Engine
 *
 * Validates clinical measurements, dates, demographics, units, and plausibility bounds.
 * Maintains non-destructive transformations and auditable correction tracking.
 */

const PHYSIOLOGICAL_BOUNDS = {
  glucose: { min: 30, max: 800, unit: 'mg/dL' },
  glucose_postprandial: { min: 30, max: 800, unit: 'mg/dL' },
  hba1c: { min: 3.0, max: 22.0, unit: '%' },
  bp_systolic: { min: 60, max: 260, unit: 'mmHg' },
  bp_diastolic: { min: 35, max: 160, unit: 'mmHg' },
  cholesterol_total: { min: 50, max: 600, unit: 'mg/dL' },
  ldl: { min: 10, max: 400, unit: 'mg/dL' },
  hdl: { min: 10, max: 160, unit: 'mg/dL' },
  creatinine: { min: 0.2, max: 20.0, unit: 'mg/dL' },
  tsh: { min: 0.01, max: 150.0, unit: 'mIU/L' },
  hemoglobin: { min: 3.0, max: 24.0, unit: 'g/dL' },
  vitamin_d: { min: 4.0, max: 180.0, unit: 'ng/mL' },
  heart_rate: { min: 30, max: 240, unit: 'bpm' },
  spo2: { min: 50, max: 100, unit: '%' },
  temperature: { min: 93.0, max: 108.0, unit: 'F' },
};

/**
 * Validates an extracted report and its measurements against patient demographic context.
 *
 * @param {object} report - Extracted medical report
 * @param {object} patient - Patient demographic record
 * @returns {{ validationStatus: string, validationDetails: Array<{ rule: string, status: string, message: string, severity: string }> }}
 */
function validateReport(report, patient = null) {
  const details = [];
  let status = 'Validated';

  // 1. Document Date Validation
  if (!report.documentDate) {
    details.push({
      rule: 'Date Completeness',
      status: 'Missing information',
      message: 'Document lacks a recognized clinical date. Date is marked unconfirmed.',
      severity: 'Medium',
    });
    status = 'Needs review';
  } else {
    const docDate = new Date(report.documentDate);
    const now = new Date();
    if (docDate > now) {
      details.push({
        rule: 'Date Plausibility',
        status: 'Needs review',
        message: `Document date (${docDate.toISOString().split('T')[0]}) is in the future.`,
        severity: 'High',
      });
      status = 'Needs review';
    }

    // Sequence check: collection date vs report date
    if (report.sampleCollectionDate && report.documentDate) {
      const collDate = new Date(report.sampleCollectionDate);
      if (collDate > docDate) {
        details.push({
          rule: 'Date Sequence',
          status: 'Potential conflict',
          message: 'Sample collection date is later than the laboratory report date.',
          severity: 'High',
        });
        status = 'Needs review';
      }
    }
  }

  // 2. Extraction & OCR Confidence Check
  if (report.extractionConfidence === 'low' || report.extractionConfidence === 'none') {
    details.push({
      rule: 'OCR / Extraction Confidence',
      status: 'Uncertain extraction',
      message: 'Text or date extraction confidence is low. Manual verification against the original document is required.',
      severity: 'Medium',
    });
    if (status !== 'Needs review') status = 'Uncertain extraction';
  }

  // Check for unreadable or smudged indicators
  const unreadableTokens = ['~?.?', '[UNREADABLE]', '[SMUDGED]', 'ILLEGIBLE', '???'];
  if (unreadableTokens.some((tok) => (report.extractedText || '').includes(tok))) {
    details.push({
      rule: 'Legibility Check',
      status: 'Uncertain extraction',
      message: 'Document contains unreadable or smudged segments. Some measurements may be incomplete.',
      severity: 'High',
    });
    status = 'Needs review';
  }

  // 3. Patient Identity Matching
  if (patient && report.extractedText) {
    const textLower = report.extractedText.toLowerCase();
    const patientNameParts = patient.name.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter((p) => p.length > 2 && p !== 'synthetic' && p !== 'demo');
    const hasNameMatch = patientNameParts.some((part) => textLower.includes(part));

    if (patientNameParts.length > 0 && !hasNameMatch) {
      details.push({
        rule: 'Patient Identity Verification',
        status: 'Source verification required',
        message: `Document text does not explicitly mention patient name "${patient.name}". Please confirm file belongs to this patient.`,
        severity: 'High',
      });
      status = 'Needs review';
    }
  }

  // 4. Numerical Measurements Plausibility & Units Check
  const measurements = report.measurements || [];
  measurements.forEach((m) => {
    const bounds = PHYSIOLOGICAL_BOUNDS[m.key];
    if (bounds) {
      // Unit validation
      if (!m.unit) {
        details.push({
          rule: 'Unit Check',
          status: 'Missing information',
          message: `Measurement "${m.label}" is missing a standard unit of measure.`,
          severity: 'Low',
        });
      }

      // Numerical plausibility
      if (m.numericValue !== null && !isNaN(m.numericValue)) {
        if (m.numericValue < bounds.min || m.numericValue > bounds.max) {
          details.push({
            rule: 'Physiological Bounds',
            status: 'Needs review',
            message: `${m.label} value (${m.numericValue} ${m.unit}) is outside expected biological range (${bounds.min} - ${bounds.max} ${bounds.unit}).`,
            severity: 'High',
          });
          status = 'Needs review';
        }
      }
    }
  });

  // If no warnings and no issues
  if (details.length === 0) {
    details.push({
      rule: 'Automated Validation Checklist',
      status: 'Validated',
      message: 'Document dates, clinical measurements, and units satisfy standard validation rules.',
      severity: 'Info',
    });
    status = 'Validated';
  }

  return {
    validationStatus: status,
    validationDetails: details,
  };
}

/**
 * Creates an auditable record of a user manual correction.
 */
function recordCorrection({ report, field, previousValue, updatedValue, editor = 'User', reason = '' }) {
  if (!report) throw new Error('Report object required');

  const auditEntry = {
    action: 'RECORD_CORRECTION',
    previousValue,
    updatedValue,
    editor,
    timestamp: new Date(),
    reason: reason || 'Manual user correction of extracted information',
  };

  if (!report.auditTrail) {
    report.auditTrail = [];
  }
  report.auditTrail.unshift(auditEntry);
  report.verificationStatus = 'corrected';

  return auditEntry;
}

module.exports = {
  validateReport,
  recordCorrection,
  PHYSIOLOGICAL_BOUNDS,
};
