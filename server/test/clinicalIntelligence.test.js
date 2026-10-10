const test = require('node:test');
const assert = require('node:assert/strict');
const { analyzeLongitudinalTrends, compareTwoReports } = require('../src/services/longitudinalEngine');
const { detectConflicts } = require('../src/services/conflictDetector');
const { checkMedicationSafety } = require('../src/services/medicationSafety');
const { calculateChecksum, checkDuplicate } = require('../src/services/duplicateDetector');
const { exportToFhirR4, exportToCsv } = require('../src/services/interoperability');
const { syntheticPatients, syntheticReports } = require('../src/seeds/syntheticData');
const mockStore = require('../src/database/mockStore');

test('LongitudinalEngine: calculates exactly -1.4 percentage points delta for HbA1c (8.6% -> 7.2%)', () => {
  const eleanorReports = syntheticReports.filter((r) => r.patientId === 'P-101');
  const trends = analyzeLongitudinalTrends(eleanorReports, 'all');

  const hba1cTrend = trends.find((t) => t.key === 'hba1c');
  assert.ok(hba1cTrend, 'HbA1c trend should be present');
  assert.equal(hba1cTrend.totalObservations, 2);
  assert.equal(hba1cTrend.earliest.numericValue, 8.6);
  assert.equal(hba1cTrend.latest.numericValue, 7.2);

  // Delta calculation: 7.2 - 8.6 = -1.4 percentage points
  assert.equal(Number(hba1cTrend.percentagePointsDelta.toFixed(1)), -1.4);
});

test('LongitudinalEngine: compareTwoReports produces side-by-side rows with percentage points', () => {
  const rep1 = syntheticReports.find((r) => r._id === 'rep-syn-001'); // 10 Oct 2025
  const rep2 = syntheticReports.find((r) => r._id === 'rep-syn-002'); // 10 Oct 2026

  const comparison = compareTwoReports(rep1, rep2);
  assert.ok(comparison.sharedMetricsCount >= 4);

  const hba1cRow = comparison.comparisonRows.find((r) => r.key === 'hba1c');
  assert.ok(hba1cRow);
  assert.equal(hba1cRow.status, 'both_present');
  assert.equal(Number(hba1cRow.percentagePointsDelta.toFixed(1)), -1.4);
});

test('ConflictDetector: flags Metformin 500mg vs 1000mg dosage conflict', () => {
  const patient = syntheticPatients[0]; // Eleanor Vance
  const eleanorReports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const conflicts = detectConflicts(patient, eleanorReports);
  assert.ok(conflicts.length > 0, 'Should detect at least one conflict');

  const metforminConflict = conflicts.find((c) =>
    c.field.toLowerCase().includes('metformin') || c.category === 'Medication'
  );
  assert.ok(metforminConflict, 'Should detect Metformin discrepancy');
  assert.match(metforminConflict.explanation, /metformin/i);
});

test('MedicationSafety: detects Lisinopril + Spironolactone hyperkalemia risk', () => {
  const patient = syntheticPatients[0];
  const eleanorReports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const safety = checkMedicationSafety(eleanorReports, patient.allergies || []);
  assert.ok(safety.safetyWarnings.length > 0, 'Should identify drug-drug interactions');

  const interaction = safety.safetyWarnings.find((w) =>
    (w.drugA === 'Lisinopril' && w.drugB === 'Spironolactone') ||
    (w.drugB === 'Lisinopril' && w.drugA === 'Spironolactone')
  );
  assert.ok(interaction, 'Should detect Lisinopril + Spironolactone interaction');
  assert.match(interaction.clinicalEffect, /hyperkalemia/i);
});

test('DuplicateDetector: calculates SHA-256 and identifies identical file buffer', () => {
  const sampleBuffer = Buffer.from('TEST MEDICAL RECORD DATA FOR CHECKSUM VERIFICATION');
  const checksum1 = calculateChecksum(sampleBuffer);
  const checksum2 = calculateChecksum(sampleBuffer);

  assert.equal(checksum1, checksum2);
  assert.equal(typeof checksum1, 'string');
  assert.equal(checksum1.length, 64);

  const existingReports = [{ _id: 'rep-001', originalFilename: 'test.txt', checksum: checksum1 }];
  const dupCheck = checkDuplicate(checksum1, existingReports);
  assert.equal(dupCheck.isDuplicate, true);
  assert.equal(dupCheck.existingReport._id, 'rep-001');

  const nonDup = checkDuplicate('different-hash', existingReports);
  assert.equal(nonDup.isDuplicate, false);
});

test('Interoperability: generates valid HL7 FHIR R4 Bundle with LOINC codes', () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const fhirBundle = exportToFhirR4(patient, reports);
  assert.equal(fhirBundle.resourceType, 'Bundle');
  assert.equal(fhirBundle.type, 'collection');
  assert.ok(fhirBundle.entry.length > 0);

  const patientEntry = fhirBundle.entry.find((e) => e.resource.resourceType === 'Patient');
  assert.ok(patientEntry);
  assert.equal(patientEntry.resource.name[0].text, patient.name);

  const obsEntries = fhirBundle.entry.filter((e) => e.resource.resourceType === 'Observation');
  assert.ok(obsEntries.length > 0);

  // Check LOINC code presence on observation
  const hba1cObs = obsEntries.find((o) => o.resource.code?.coding?.[0]?.code === '4548-4');
  assert.ok(hba1cObs, 'Should have LOINC code 4548-4 for HbA1c');
});

test('Interoperability: exports valid CSV data with header row', () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const csv = exportToCsv(patient, reports);
  assert.ok(typeof csv === 'string');
  assert.match(csv, /^PatientID,PatientName,DocumentDate,/);
  assert.match(csv, /hba1c/i);
});

test('MockStore: provides full offline in-memory CRUD parity for clinical intelligence', async () => {
  mockStore.resetToDefaults();
  assert.equal(mockStore.isMockMode(), true);

  const patients = await mockStore.getPatients();
  assert.ok(patients.length >= 2);

  const reports = await mockStore.getReports({ patientId: 'P-101' });
  assert.ok(reports.length >= 4);

  const conflicts = await mockStore.getConflicts('P-101');
  assert.ok(conflicts.length > 0);

  const alerts = await mockStore.getAlerts('P-101');
  assert.ok(alerts.length > 0);

  // Test measurement correction
  const rep1 = reports.find((r) => r._id === 'rep-syn-001');
  const updatedRep = await mockStore.correctMeasurement(rep1._id, 'glucose', '180 mg/dL', 'Calibration adjustment', 'Dr. Tester');
  assert.ok(updatedRep);
  const correctedGlucose = updatedRep.measurements.find((m) => m.key === 'glucose');
  assert.equal(correctedGlucose.rawValue, '180 mg/dL');
  assert.equal(correctedGlucose.isCorrected, true);
  assert.ok(updatedRep.auditTrail.length > 0);

  // Check audit log
  const auditLogs = await mockStore.getAuditLogs('P-101');
  assert.ok(auditLogs.length > 0);
  const corrLog = auditLogs.find((l) => l.action === 'RECORD_CORRECTION');
  assert.ok(corrLog);
});
