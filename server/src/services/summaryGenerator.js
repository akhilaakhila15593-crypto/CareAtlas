/**
 * CareAtlas Medical Summary Generator
 *
 * Synthesizes documented health history, longitudinal laboratory findings,
 * medications, allergies, pending follow-ups, and diagnostic gaps.
 */

const { analyzeLongitudinalTrends } = require('./longitudinalEngine');
const { checkMedicationSafety } = require('./medicationSafety');
const { detectConflicts } = require('./conflictDetector');

/**
 * Generates an evidence-grounded medical summary for a patient.
 *
 * @param {object} patient
 * @param {Array} reports
 * @returns {object} Structured medical summary
 */
function generateMedicalSummary(patient, reports = []) {
  if (!patient) throw new Error('Patient required');

  const now = new Date();
  const sortedReports = [...reports].sort((a, b) => {
    const dA = a.documentDate ? new Date(a.documentDate).getTime() : 0;
    const dB = b.documentDate ? new Date(b.documentDate).getTime() : 0;
    return dA - dB;
  });

  const periodCovered = {
    from: sortedReports.length > 0 && sortedReports[0].documentDate ? sortedReports[0].documentDate : null,
    to: sortedReports.length > 0 && sortedReports[sortedReports.length - 1].documentDate ? sortedReports[sortedReports.length - 1].documentDate : null,
  };

  const documentsConsidered = sortedReports.map((r) => r.originalFilename);

  // 1. Documented Conditions with Evidence Links
  const conditions = [];
  const conditionSet = new Set();
  sortedReports.forEach((r) => {
    (r.linkedConditions || []).forEach((c) => {
      if (!conditionSet.has(c)) {
        conditionSet.add(c);
        conditions.push({
          condition: c,
          evidenceSnippet: `Explicitly documented in ${r.originalFilename}`,
          sourceReportId: r._id,
          reportTitle: r.originalFilename,
          date: r.documentDate,
        });
      }
    });
  });

  // If none extracted from linkedConditions, check patient master profile
  if (conditions.length === 0 && patient.activeConditions) {
    patient.activeConditions.forEach((c) => {
      conditions.push({
        condition: c,
        evidenceSnippet: 'Documented in patient baseline medical history',
        sourceReportId: 'baseline-profile',
        reportTitle: 'Master Patient Profile',
        date: null,
      });
    });
  }

  // 2. Key Observations & Longitudinal Trends
  const longitudinalTrends = analyzeLongitudinalTrends(sortedReports, 'all');
  const keyObservations = longitudinalTrends.map((t) => ({
    label: t.label,
    latestValue: `${t.latest.value} (${t.latest.date})`,
    previousValue: t.previous ? `${t.previous.value} (${t.previous.date})` : 'N/A',
    changeText: t.calculationExplanation,
    date: t.latest.date ? new Date(t.latest.date) : null,
    sourceTitle: t.latest.reportTitle,
  }));

  // 3. Active Documented Medications
  const medSafety = checkMedicationSafety(sortedReports, patient.allergies || []);
  const activeMedications = (medSafety.reconciledMedications || []).map((m) => ({
    name: m.name,
    dosage: `${m.strength || ''} ${m.dosage || ''}`.trim(),
    frequency: m.frequency || 'Daily',
    sourceTitle: m.reportTitle,
  }));

  // 4. Recorded Allergies
  const recordedAllergies = (patient.allergies || []).map(
    (a) => `${a.allergen} (${a.reaction || 'Allergic response'} - ${a.severity})`
  );

  // 5. Abnormalities requiring review
  const abnormalities = [];
  sortedReports.forEach((r) => {
    (r.measurements || []).forEach((m) => {
      if (m.abnormalFlag === 'HIGH' || m.abnormalFlag === 'CRITICAL' || m.abnormalFlag === 'ELEVATED') {
        abnormalities.push({
          test: m.label,
          value: m.rawValue,
          refRange: m.referenceRange,
          severity: m.abnormalFlag === 'CRITICAL' ? 'High' : 'Moderate',
          sourceTitle: r.originalFilename,
        });
      }
    });
  });

  // 6. Pending Follow-Ups
  const pendingFollowUps = [];
  sortedReports.forEach((r) => {
    if ((r.extractedText || '').toLowerCase().includes('repeat hba1c recommended in 3-4 months')) {
      pendingFollowUps.push({
        recommendation: 'Repeat HbA1c testing recommended in 3-4 months following glycemic therapy adjustment.',
        sourceTitle: r.originalFilename,
        date: r.documentDate,
      });
    }
  });

  // 7. Data Gaps and Conflicts
  const dataGaps = [];
  if (!sortedReports.some((r) => (r.extractedText || '').toLowerCase().includes('tsh'))) {
    dataGaps.push('Thyroid Stimulating Hormone (TSH) laboratory test not present in stored history.');
  }
  if (!sortedReports.some((r) => (r.extractedText || '').toLowerCase().includes('eye exam') || (r.extractedText || '').toLowerCase().includes('retinal'))) {
    dataGaps.push('Annual diabetic retinal / ophthalmology examination documentation missing.');
  }

  const conflicts = detectConflicts(patient.demoId || patient._id, sortedReports, patient);
  const unresolvedConflicts = conflicts
    .filter((c) => c.status === 'unresolved')
    .map((c) => `${c.field}: ${c.explanation}`);

  // 8. Narrative Clinical Summary
  let narrative = `Comprehensive clinical review for ${patient.name} (Age: ${patient.age}, ${patient.sex}). `;
  narrative += `Based on analysis of ${sortedReports.length} stored documents spanning ${periodCovered.from ? new Date(periodCovered.from).toLocaleDateString() : 'N/A'} through ${periodCovered.to ? new Date(periodCovered.to).toLocaleDateString() : 'N/A'}.\n\n`;

  narrative += `• Documented Conditions: ${conditions.map((c) => c.condition).join(', ') || 'None recorded'}.\n`;
  narrative += `• Active Medications: ${activeMedications.map((m) => `${m.name} ${m.dosage} (${m.frequency})`).join(', ') || 'None recorded'}.\n`;
  narrative += `• Key Trend Observations: ${keyObservations.slice(0, 3).map((o) => `${o.label}: ${o.changeText}`).join(' ')}\n`;

  if (abnormalities.length > 0) {
    narrative += `• Laboratory Findings Requiring Clinical Review: ${abnormalities.slice(0, 3).map((a) => `${a.test} recorded at ${a.value} (Reference: ${a.refRange})`).join('; ')}.\n`;
  }

  if (unresolvedConflicts.length > 0) {
    narrative += `• Data Conflicts to Reconcile: ${unresolvedConflicts.join('; ')}.\n`;
  }

  narrative += `\n*Notice: This summary is generated algorithmically for review assistance and does not replace clinician evaluation.*`;

  return {
    patientId: patient.demoId || patient._id,
    generatedAt: now,
    periodCovered,
    documentsConsidered,
    documentedConditions: conditions,
    keyObservations,
    activeMedications,
    recordedAllergies,
    abnormalities,
    pendingFollowUps,
    dataGaps,
    unresolvedConflicts,
    narrativeSummary: narrative,
    disclaimer:
      'This summary was automatically compiled from uploaded patient medical documents. It is provided for informational and clinical review support only and does not constitute a doctor-approved diagnosis or treatment plan.',
  };
}

module.exports = {
  generateMedicalSummary,
};
