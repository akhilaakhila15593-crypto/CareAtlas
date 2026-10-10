const test = require('node:test');
const assert = require('node:assert/strict');
const { processHealthQuery, MISSING_EVIDENCE_TEMPLATE } = require('../src/services/aiAssistant');
const { syntheticPatients, syntheticReports } = require('../src/seeds/syntheticData');

test('AIAssistant: should return transparent missing evidence message when topic has no stored records', async () => {
  const patient = syntheticPatients[0]; // Eleanor Vance
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  // Query topic with zero records (e.g. Asthma)
  const result = await processHealthQuery({
    patient,
    reports,
    question: 'Does the patient have asthma or any pulmonary issues?',
    cloudConsent: false,
  });

  assert.equal(result.missingEvidence, true);
  assert.ok(result.answer.includes(MISSING_EVIDENCE_TEMPLATE));
  assert.equal(result.citations.length, 0);
});

test('AIAssistant: should return transparent missing evidence message for thyroid inquiry when patient has no thyroid records', async () => {
  const patient = syntheticPatients[0]; // Eleanor Vance (has no thyroid tests)
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const result = await processHealthQuery({
    patient,
    reports,
    question: "What is the patient's latest thyroid result?",
    cloudConsent: false,
  });

  assert.equal(result.missingEvidence, true);
  assert.ok(result.answer.includes(MISSING_EVIDENCE_TEMPLATE));
  assert.match(result.answer, /thyroid function tests/i);
  assert.equal(result.citations.length, 0);
});

test('AIAssistant: should prompt for clarification when query is ambiguous ("What is my sugar level?")', async () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const result = await processHealthQuery({
    patient,
    reports,
    question: 'What is my sugar level?',
    cloudConsent: false,
  });

  assert.equal(result.mode, 'deterministic-clarification');
  assert.ok(Array.isArray(result.clarificationOptions));
  assert.ok(result.clarificationOptions.length >= 2);
  assert.ok(result.clarificationOptions.includes('Fasting Blood Glucose'));
  assert.ok(result.clarificationOptions.includes('Hemoglobin A1c (HbA1c)'));
});

test('AIAssistant: should report HbA1c decrease explicitly as 1.4 percentage points', async () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const result = await processHealthQuery({
    patient,
    reports,
    question: 'How has my HbA1c changed over time?',
    cloudConsent: false,
  });

  assert.equal(result.missingEvidence, false);
  assert.match(result.answer, /1\.4\s*percentage\s*points/i);
  assert.ok(result.citations.length > 0);
});

test('AIAssistant: should return urgent safety guardrail for emergency symptom terms', async () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const result = await processHealthQuery({
    patient,
    reports,
    question: 'The patient is feeling sudden chest pain and shortness of breath.',
    cloudConsent: false,
  });

  assert.equal(result.isUrgent, true);
  assert.match(result.answer, /CRITICAL MEDICAL SAFETY ALERT/);
  assert.match(result.answer, /emergency/);
});

test('AIAssistant: should compute chronological trends for multiple dated measurements', async () => {
  const patient = syntheticPatients[0];
  const reports = syntheticReports.filter((r) => r.patientId === 'P-101');

  const result = await processHealthQuery({
    patient,
    reports,
    question: 'What is the trend for my HbA1c and glucose over time?',
    cloudConsent: false,
  });

  assert.equal(result.missingEvidence, false);
  assert.match(result.answer, /Chronological Measurement History/);
  assert.match(result.answer, /Hemoglobin A1c/);
  assert.ok(result.citations.length > 0);
});
