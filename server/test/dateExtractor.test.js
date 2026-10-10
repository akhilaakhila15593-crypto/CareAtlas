const test = require('node:test');
const assert = require('node:assert/strict');
const { extractDocumentDate } = require('../src/services/dateExtractor');

test('DateExtractor: should extract ISO format date with Report Date label', () => {
  const text = `
    Patient: Eleanor Vance
    Report Date: 2026-10-01
    Test: Comprehensive Metabolic Panel
  `;
  const result = extractDocumentDate(text);
  assert.equal(result.normalizedDate, '2026-10-01');
  assert.equal(result.confidence, 'high');
  assert.match(result.rawDateEvidence, /2026-10-01/);
});

test('DateExtractor: should prefer Report Date over DOB', () => {
  const text = `
    Patient Name: Eleanor Vance
    DOB: 12/04/1967
    Date of Birth: 04/12/1967
    Collection Date: 11/15/2025
  `;
  const result = extractDocumentDate(text);
  assert.equal(result.normalizedDate, '2025-11-15');
  assert.equal(result.confidence, 'high');
  assert.notEqual(result.normalizedDate, '1967-12-04');
  assert.notEqual(result.normalizedDate, '1967-04-12');
});

test('DateExtractor: should extract named month format like "Oct 1, 2026" or "1 October 2026"', () => {
  const text1 = `Visit Date: Oct 1, 2026 - Cardiology Consultation`;
  const res1 = extractDocumentDate(text1);
  assert.equal(res1.normalizedDate, '2026-10-01');
  assert.equal(res1.confidence, 'high');

  const text2 = `Prescription Date: 12 August 2026`;
  const res2 = extractDocumentDate(text2);
  assert.equal(res2.normalizedDate, '2026-08-12');
  assert.equal(res2.confidence, 'high');
});

test('DateExtractor: should return null and confidence "none" when no date exists without substituting upload date', () => {
  const text = `General dietary notes and exercise recommendations. No dates mentioned.`;
  const result = extractDocumentDate(text);
  assert.equal(result.normalizedDate, null);
  assert.equal(result.confidence, 'none');
  assert.match(result.message, /No document date detected/);
});
