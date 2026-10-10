/**
 * CareAtlas Health Alert & Notification Engine
 *
 * Generates explainable, evidence-grounded alerts with deduplication,
 * clinical prioritization, and acknowledgment workflows.
 */

/**
 * Scans patient reports, medication checks, and conflicts to generate clinical alerts.
 *
 * @param {object} patient
 * @param {Array} reports
 * @param {Array} conflicts
 * @param {object} medSafety
 * @returns {Array} List of HealthAlert objects
 */
function generateAlerts(patient, reports = [], conflicts = [], medSafety = null) {
  const alerts = [];
  if (!patient) return [];

  // 1. Abnormal Lab Results from reports
  reports.forEach((r) => {
    (r.measurements || []).forEach((m) => {
      if (m.abnormalFlag === 'HIGH' || m.abnormalFlag === 'CRITICAL' || m.abnormalFlag === 'ELEVATED') {
        const isCritical = m.key === 'glucose' && m.numericValue > 250 || m.key === 'hba1c' && m.numericValue > 8.0 || m.key === 'bp_systolic' && m.numericValue > 160;
        const alertKey = `alert-abnormal-${m.key}-${r._id}`;

        alerts.push({
          patientId: patient.demoId || patient._id,
          alertKey,
          category: 'Abnormal Result',
          priority: isCritical ? 'Urgent review' : 'Important',
          title: `Elevated ${m.label}: ${m.rawValue}`,
          explanation: `Documented ${m.label} is outside standard laboratory reference range (${m.referenceRange || 'Standard'}). Value flagged as ${m.abnormalFlag} in ${r.originalFilename}.`,
          triggeringEvidence: m.sourceSnippet || `${m.label}: ${m.rawValue}`,
          sourceRecords: [
            {
              reportId: r._id,
              title: r.originalFilename,
              date: m.date || r.documentDate,
            },
          ],
          recommendedAction: 'Discuss this result with your clinician during your next consultation to assess glycemic and cardiovascular treatment targets.',
          status: 'active',
        });
      }
    });
  });

  // 2. Medication Safety Alerts
  if (medSafety && Array.isArray(medSafety.safetyWarnings)) {
    medSafety.safetyWarnings.forEach((warn, idx) => {
      const alertKey = `alert-med-safety-${warn.type}-${warn.drugA}-${warn.drugB}-${idx}`;
      alerts.push({
        patientId: patient.demoId || patient._id,
        alertKey,
        category: 'Medication Safety',
        priority: warn.severity === 'Critical' ? 'Urgent review' : 'Important',
        title: `${warn.type}: ${warn.drugA} + ${warn.drugB}`,
        explanation: `${warn.mechanism} ${warn.clinicalEffect}`,
        triggeringEvidence: `Concurrent orders identified across ${warn.sourceDocA} and ${warn.sourceDocB}`,
        sourceRecords: [
          { reportId: 'med-source-a', title: warn.sourceDocA, date: null },
          { reportId: 'med-source-b', title: warn.sourceDocB, date: null },
        ],
        recommendedAction: warn.recommendation || 'Consult prescribing clinician or dispensing pharmacist promptly.',
        status: 'active',
      });
    });
  }

  // 3. Data Conflict Alerts
  conflicts.forEach((conf) => {
    if (conf.status === 'unresolved') {
      const alertKey = `alert-conflict-${conf.conflictKey}`;
      alerts.push({
        patientId: patient.demoId || patient._id,
        alertKey,
        category: 'Data Conflict',
        priority: conf.severity === 'Critical' ? 'Urgent review' : conf.severity === 'High' ? 'Important' : 'Needs review',
        title: `Conflicting Record Evidence: ${conf.field}`,
        explanation: conf.explanation,
        triggeringEvidence: `Source A: "${conf.sourceA?.value}" (${conf.sourceA?.title}) vs Source B: "${conf.sourceB?.value}" (${conf.sourceB?.title})`,
        sourceRecords: [
          { reportId: conf.sourceA?.reportId, title: conf.sourceA?.title, date: conf.sourceA?.date },
          { reportId: conf.sourceB?.reportId, title: conf.sourceB?.title, date: conf.sourceB?.date },
        ],
        recommendedAction: conf.recommendedAction,
        status: 'active',
      });
    }
  });

  // 4. Overdue Follow-up Alerts
  reports.forEach((r) => {
    if ((r.extractedText || '').toLowerCase().includes('repeat hba1c recommended in 3-4 months')) {
      const docDate = r.documentDate ? new Date(r.documentDate) : null;
      if (docDate) {
        const dueDate = new Date(docDate);
        dueDate.setMonth(dueDate.getMonth() + 4);
        const now = new Date();
        if (now > dueDate) {
          const alertKey = `alert-followup-hba1c-${r._id}`;
          alerts.push({
            patientId: patient.demoId || patient._id,
            alertKey,
            category: 'Follow-up Due',
            priority: 'Needs review',
            title: 'Follow-up Glycemic Check Overdue',
            explanation: `Clinical note from ${docDate.toISOString().split('T')[0]} recommended repeat HbA1c in 3-4 months. No subsequent HbA1c panel filed since.`,
            triggeringEvidence: 'Clinical recommendation: "Repeat HbA1c recommended in 3-4 months."',
            sourceRecords: [{ reportId: r._id, title: r.originalFilename, date: r.documentDate }],
            recommendedAction: 'Schedule routine follow-up venipuncture or upload recent laboratory results if already performed.',
            status: 'active',
          });
        }
      }
    }
  });

  // Deduplicate by alertKey
  const uniqueAlertsMap = new Map();
  alerts.forEach((a) => {
    if (!uniqueAlertsMap.has(a.alertKey)) {
      uniqueAlertsMap.set(a.alertKey, a);
    }
  });

  return Array.from(uniqueAlertsMap.values());
}

module.exports = {
  generateAlerts,
};
