/**
 * CareAtlas Intelligent Medical Document Date Extractor
 *
 * Scans raw document text, prioritizes clinical date labels (Report Date, Sample Date,
 * Visit Date, Prescription Date), strictly disqualifies Date of Birth (DOB),
 * and normalizes to an ISO Date string.
 */

const MONTHS_MAP = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, sept: 9, september: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
};

const HIGH_PRIORITY_LABELS = [
  'report date',
  'date of report',
  'sample collection date',
  'collection date',
  'sample date',
  'specimen date',
  'visit date',
  'date of visit',
  'encounter date',
  'date of encounter',
  'prescription date',
  'date prescribed',
  'prescribed on',
  'study date',
  'exam date',
  'date of service',
  'service date',
  'test date',
  'signed on',
  'order date',
];

const DOB_DISQUALIFIERS = [
  'dob',
  'd.o.b',
  'date of birth',
  'birth date',
  'birthdate',
  'born',
];

/**
 * Normalizes year, month (1-12), day (1-31) to YYYY-MM-DD string.
 */
function toIsoDate(year, month, day) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  const d = parseInt(day, 10);

  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  if (y < 1980 || y > 2035) return null; // Reasonable medical record timeframe
  if (m < 1 || m > 12) return null;
  if (d < 1 || d > 31) return null;

  const mm = String(m).padStart(2, '0');
  const dd = String(d).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * Extracts and scores document date candidates from text.
 *
 * @param {string} text - Raw document text
 * @returns {{
 *   normalizedDate: string | null,
 *   rawDateEvidence: string | null,
 *   confidence: 'high' | 'medium' | 'low' | 'none',
 *   message: string
 * }}
 */
function extractDocumentDate(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      normalizedDate: null,
      rawDateEvidence: null,
      confidence: 'none',
      message: 'No document text available to extract date.',
    };
  }

  const lines = text.split(/\r?\n/);
  const candidates = [];

  // Regex patterns:
  // 1. ISO: YYYY-MM-DD or YYYY/MM/DD
  const isoRegex = /\b(20\d\d|199\d)[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g;

  // 2. Month name: "October 1, 2026" or "Oct 1, 2026" or "1 October 2026" or "01-Oct-2026"
  const monthNameRegex = /\b(?:(0?[1-9]|[12]\d|3[01])[\s\-/]+)?(jan|january|feb|february|mar|march|apr|april|may|jun|june|jul|july|aug|august|sep|sept|september|oct|october|nov|november|dec|december)[\s\-/]+(?:(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?[\s\-/]+)?(20\d\d|199\d)\b/gi;

  // 3. Slash / dash: MM/DD/YYYY or DD/MM/YYYY
  const slashRegex = /\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|[12]\d|3[01])[-/](20\d\d|199\d)\b/g;

  lines.forEach((line, lineIndex) => {
    const lowerLine = line.toLowerCase();

    // Check if line contains a DOB disqualifier
    const isDobLine = DOB_DISQUALIFIERS.some((dob) => lowerLine.includes(dob));

    // Check if line contains high-priority labels
    const matchedHighPriority = HIGH_PRIORITY_LABELS.find((label) => lowerLine.includes(label));
    const hasGenericDate = lowerLine.includes('date:') || lowerLine.includes('dated:');

    // 1. Scan for ISO matches
    let match;
    while ((match = isoRegex.exec(line)) !== null) {
      const year = match[1];
      const month = match[2];
      const day = match[3];
      const iso = toIsoDate(year, month, day);
      if (iso) {
        let score = 20;
        if (isDobLine) score -= 1000;
        if (matchedHighPriority) score += 60;
        else if (hasGenericDate) score += 30;

        candidates.push({
          iso,
          raw: match[0],
          context: line.trim(),
          score,
          label: matchedHighPriority || (hasGenericDate ? 'Date' : 'Standalone Date'),
          isDob: isDobLine,
        });
      }
    }

    // 2. Scan for Month Name matches
    while ((match = monthNameRegex.exec(line)) !== null) {
      const day1 = match[1];
      const monthStr = match[2].toLowerCase();
      const day2 = match[3];
      const year = match[4];

      const day = day1 || day2 || '1';
      const month = MONTHS_MAP[monthStr];

      if (month) {
        const iso = toIsoDate(year, month, day);
        if (iso) {
          let score = 25; // Named months are less ambiguous
          if (isDobLine) score -= 1000;
          if (matchedHighPriority) score += 60;
          else if (hasGenericDate) score += 30;

          candidates.push({
            iso,
            raw: match[0],
            context: line.trim(),
            score,
            label: matchedHighPriority || (hasGenericDate ? 'Date' : 'Named Month Date'),
            isDob: isDobLine,
          });
        }
      }
    }

    // 3. Scan for Slash/Dash matches (e.g. 11/15/2025 or 15/11/2025)
    while ((match = slashRegex.exec(line)) !== null) {
      const part1 = parseInt(match[1], 10);
      const part2 = parseInt(match[2], 10);
      const year = match[3];

      let month, day;
      if (part1 > 12 && part2 <= 12) {
        // Must be DD/MM/YYYY
        day = part1;
        month = part2;
      } else if (part1 <= 12 && part2 > 12) {
        // Must be MM/DD/YYYY
        month = part1;
        day = part2;
      } else {
        // Ambiguous, default to MM/DD/YYYY (standard US medical convention)
        month = part1;
        day = part2;
      }

      const iso = toIsoDate(year, month, day);
      if (iso) {
        let score = 15;
        if (isDobLine) score -= 1000;
        if (matchedHighPriority) score += 60;
        else if (hasGenericDate) score += 30;

        candidates.push({
          iso,
          raw: match[0],
          context: line.trim(),
          score,
          label: matchedHighPriority || (hasGenericDate ? 'Date' : 'Numeric Date'),
          isDob: isDobLine,
        });
      }
    }
  });

  // Filter out any candidates with negative scores (DOB lines)
  const validCandidates = candidates.filter((c) => c.score > 0);

  if (validCandidates.length === 0) {
    return {
      normalizedDate: null,
      rawDateEvidence: null,
      confidence: 'none',
      message: 'No document date detected in record text. Please verify and confirm manually.',
    };
  }

  // Sort by highest score first; if tied, take the one appearing earlier in the document
  validCandidates.sort((a, b) => b.score - a.score);
  const best = validCandidates[0];

  let confidence = 'low';
  if (best.score >= 70) {
    confidence = 'high';
  } else if (best.score >= 40) {
    confidence = 'medium';
  }

  // Build readable evidence string
  const evidence = best.context.length <= 100 ? best.context : `${best.label}: ${best.raw}`;

  return {
    normalizedDate: best.iso,
    rawDateEvidence: evidence,
    confidence,
    message: `Detected ${best.label} (${best.raw}) normalized to ${best.iso} with ${confidence} confidence.`,
  };
}

module.exports = {
  extractDocumentDate,
  toIsoDate,
};
