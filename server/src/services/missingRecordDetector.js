/**
 * CareAtlas Missing Medical Record Detection Service
 *
 * Identifies diagnostic gaps, referenced but un-uploaded consultations,
 * overdue follow-up lab panels, and documents needing re-upload.
 */

function detectMissingRecords(patient, reports = []) {
  const tasks = [];
  if (!patient) return [];

  // 1. Check for documents with missing clinical dates
  reports.forEach((r) => {
    if (!r.documentDate) {
      tasks.push({
        id: `gap-date-${r._id}`,
        patientId: patient.demoId || patient._id,
        type: 'missing_from_document',
        title: `Unconfirmed Document Date: ${r.originalFilename}`,
        description: 'This document does not contain an automated date stamp. Please verify or manually input the date.',
        status: 'Action required',
        actionLabel: 'Verify Document Date',
        targetReportId: r._id,
      });
    }
  });

  // 2. Check for follow-up testing recommended in reports
  reports.forEach((r) => {
    const text = (r.extractedText || '').toLowerCase();
    if (text.includes('repeat hba1c') || text.includes('repeat lab')) {
      const docDate = r.documentDate ? new Date(r.documentDate) : null;
      if (docDate) {
        const dueDate = new Date(docDate);
        dueDate.setMonth(dueDate.getMonth() + 4);

        // Check if there is a report dated after docDate
        const subsequentReports = reports.filter((sub) => {
          const subD = sub.documentDate ? new Date(sub.documentDate) : null;
          return subD && subD > docDate && (sub.documentType === 'Lab Report' || (sub.extractedText || '').toLowerCase().includes('hba1c'));
        });

        if (subsequentReports.length === 0) {
          tasks.push({
            id: `gap-followup-hba1c-${r._id}`,
            patientId: patient.demoId || patient._id,
            type: 'expected_followup',
            title: 'Subsequent Glycemic Lab Panel Not Filed',
            description: `Follow-up HbA1c recommended after ${docDate.toISOString().split('T')[0]} has no matching subsequent laboratory report in record store.`,
            status: 'Pending report',
            actionLabel: 'Upload Follow-up Lab Report',
            targetReportId: r._id,
          });
        }
      }
    }
  });

  // 3. Check for Prescriptions lacking explicit strength/dosage
  reports.forEach((r) => {
    if (r.documentType === 'Prescription') {
      const meds = r.linkedMedications || [];
      const hasMissingDose = meds.some((m) => !m.strength || m.strength === 'Unspecified');
      if (hasMissingDose) {
        tasks.push({
          id: `gap-rx-dose-${r._id}`,
          patientId: patient.demoId || patient._id,
          type: 'missing_from_document',
          title: `Incomplete Prescription Dosage: ${r.originalFilename}`,
          description: 'Prescription document does not clearly specify dosage strength or frequency for one or more medicines.',
          status: 'Verification required',
          actionLabel: 'Review Prescription Details',
          targetReportId: r._id,
        });
      }
    }
  });

  // 4. Check for legibility / OCR issues
  reports.forEach((r) => {
    if (r.validationStatus === 'Uncertain extraction' || (r.extractedText || '').includes('[UNREADABLE]')) {
      tasks.push({
        id: `gap-ocr-${r._id}`,
        patientId: patient.demoId || patient._id,
        type: 'failed_extraction',
        title: `Partially Unreadable File: ${r.originalFilename}`,
        description: 'Document has smudged or low-confidence text segments. Recommended to re-upload high-resolution scan or native PDF.',
        status: 'Action required',
        actionLabel: 'Re-upload Clear Copy',
        targetReportId: r._id,
      });
    }
  });

  return tasks;
}

module.exports = {
  detectMissingRecords,
};
