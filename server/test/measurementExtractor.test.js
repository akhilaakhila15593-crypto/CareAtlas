const test = require('node:test');
const assert = require('node:assert/strict');
const { extractMeasurements } = require('../src/services/measurementExtractor');

test('MeasurementExtractor: should extract blood glucose, HbA1c, and BP', () => {
  const text = `
    Fasting Blood Glucose: 138 mg/dL
    Hemoglobin A1c: 7.2 %
    Blood Pressure: 130/84 mmHg
  `;
  const results = extractMeasurements(text, new Date('2026-05-10'), 'rep-001');

  const glucose = results.find((m) => m.key === 'glucose');
  assert.ok(glucose);
  assert.equal(glucose.numericValue, 138);
  assert.equal(glucose.unit, 'mg/dL');

  const hba1c = results.find((m) => m.key === 'hba1c');
  assert.ok(hba1c);
  assert.equal(hba1c.numericValue, 7.2);
  assert.equal(hba1c.unit, '%');

  const bpSys = results.find((m) => m.key === 'bp_systolic');
  const bpDia = results.find((m) => m.key === 'bp_diastolic');
  assert.ok(bpSys);
  assert.ok(bpDia);
  assert.equal(bpSys.numericValue, 130);
  assert.equal(bpDia.numericValue, 84);
});

test('MeasurementExtractor: should extract lipid panel, TSH, creatinine, vitamin D, and hemoglobin', () => {
  const text = `
    Total Cholesterol: 210 mg/dL
    LDL Cholesterol: 125 mg/dL
    HDL Cholesterol: 48 mg/dL
    TSH: 2.30 mIU/L
    Serum Creatinine: 0.94 mg/dL
    Hemoglobin: 14.0 g/dL
    Vitamin D: 32 ng/mL
  `;
  const results = extractMeasurements(text, new Date('2026-05-10'), 'rep-002');

  const keys = results.map((m) => m.key);
  assert.ok(keys.includes('cholesterol_total'));
  assert.ok(keys.includes('ldl'));
  assert.ok(keys.includes('hdl'));
  assert.ok(keys.includes('tsh'));
  assert.ok(keys.includes('creatinine'));
  assert.ok(keys.includes('hemoglobin'));
  assert.ok(keys.includes('vitamin_d'));

  const ldl = results.find((m) => m.key === 'ldl');
  assert.equal(ldl.numericValue, 125);
  assert.equal(ldl.unit, 'mg/dL');
});

test('MeasurementExtractor: should extract vitals (heart rate, SpO2, body temperature)', () => {
  const text = `
    Heart Rate: 74 bpm
    Oxygen Saturation: 99 %
    Body Temperature: 98.6 F
  `;
  const results = extractMeasurements(text, new Date('2026-05-10'), 'rep-003');

  const hr = results.find((m) => m.key === 'heart_rate');
  assert.ok(hr);
  assert.equal(hr.numericValue, 74);

  const spo2 = results.find((m) => m.key === 'spo2');
  assert.ok(spo2);
  assert.equal(spo2.numericValue, 99);

  const temp = results.find((m) => m.key === 'temperature');
  assert.ok(temp);
  assert.equal(temp.numericValue, 98.6);
});
