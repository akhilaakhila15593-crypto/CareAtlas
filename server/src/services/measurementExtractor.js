/**
 * CareAtlas Clinical Measurement & Clinical Entity Extractor
 *
 * Extracts structured vital signs, laboratory parameters, abnormal flags,
 * source snippets, documented conditions, and prescription orders.
 */

const MEASUREMENT_DEFINITIONS = [
  // 1. Blood Pressure (handles both "120/80 mmHg" or separate mentions)
  {
    key: 'bp_compound',
    label: 'Blood Pressure',
    regex: /(?:blood\s*pressure|b[\s.]?p[\s.]?)\s*(?:[:=]|\s+)\s*(\d{2,3})\s*[\/\\-]\s*(\d{2,3})\s*(?:mm\s*hg)?/i,
    handler: (match, docDate, reportId, line, abnormalFlag) => {
      const systolic = parseInt(match[1], 10);
      const diastolic = parseInt(match[2], 10);
      if (systolic >= 60 && systolic <= 260 && diastolic >= 35 && diastolic <= 160) {
        return [
          {
            key: 'bp_systolic',
            label: 'Blood Pressure (Systolic)',
            rawValue: `${systolic} mmHg`,
            numericValue: systolic,
            unit: 'mmHg',
            date: docDate,
            referenceRange: '< 120 mmHg',
            abnormalFlag: systolic > 130 ? 'ELEVATED' : 'NORMAL',
            sourceSnippet: line.trim(),
            pageNumber: 1,
            reportId,
          },
          {
            key: 'bp_diastolic',
            label: 'Blood Pressure (Diastolic)',
            rawValue: `${diastolic} mmHg`,
            numericValue: diastolic,
            unit: 'mmHg',
            date: docDate,
            referenceRange: '< 80 mmHg',
            abnormalFlag: diastolic > 85 ? 'ELEVATED' : 'NORMAL',
            sourceSnippet: line.trim(),
            pageNumber: 1,
            reportId,
          },
        ];
      }
      return [];
    },
  },

  // 2. HbA1c / Hemoglobin A1c
  {
    key: 'hba1c',
    label: 'Hemoglobin A1c (HbA1c)',
    regex: /(?:hemoglobin\s*a1c|hba1c|a1c|glycated\s*hemoglobin)\s*(?:[:=]|\s+)\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:%|\s*percent)?/i,
    unit: '%',
    defaultRange: '4.0 - 5.6 %',
    min: 3.0,
    max: 20.0,
  },

  // 3. Two-hour post-meal glucose / Postprandial glucose (MUST BE CHECKED BEFORE FASTING GLUCOSE)
  {
    key: 'glucose_postprandial',
    label: 'Two-Hour Post-Meal Glucose',
    regex: /(?:two[- ]hour\s+post[- ]meal\s+glucose|2[- ]hour\s+post[- ]meal\s+glucose|post[- ]prandial\s+(?:blood\s*)?glucose|postprandial\s+glucose|ppbs)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: 'mg/dL',
    defaultRange: '< 140 mg/dL',
    min: 30,
    max: 700,
  },

  // 4. Fasting Glucose / Blood Sugar
  {
    key: 'glucose',
    label: 'Fasting Blood Glucose',
    regex: /(?:fasting\s*(?:blood\s*)?glucose|blood\s*glucose|fasting\s*blood\s*sugar|fbs|glucose)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl|mmol\/l)?/i,
    unit: 'mg/dL',
    defaultRange: '70 - 99 mg/dL',
    min: 30,
    max: 600,
  },

  // 5. Total Cholesterol
  {
    key: 'cholesterol_total',
    label: 'Total Cholesterol',
    regex: /(?:total\s*cholesterol|cholesterol[,\s]+total)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl)?/i,
    unit: 'mg/dL',
    defaultRange: '< 200 mg/dL',
    min: 50,
    max: 500,
  },

  // 6. LDL Cholesterol
  {
    key: 'ldl',
    label: 'LDL Cholesterol',
    regex: /(?:ldl(?:\s*cholesterol|\s*-?\s*c)?|low\s*density\s*lipoprotein)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:mg\/dl)?/i,
    unit: 'mg/dL',
    defaultRange: '< 100 mg/dL',
    min: 20,
    max: 350,
  },

  // 7. HDL Cholesterol
  {
    key: 'hdl',
    label: 'HDL Cholesterol',
    regex: /(?:hdl(?:\s*cholesterol|\s*-?\s*c)?|high\s*density\s*lipoprotein)\s*(?:[:=]|\s+)\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:mg\/dl)?/i,
    unit: 'mg/dL',
    defaultRange: '> 50 mg/dL',
    min: 15,
    max: 150,
  },

  // 8. Serum Creatinine
  {
    key: 'creatinine',
    label: 'Serum Creatinine',
    regex: /(?:serum\s*creatinine|creatinine)\s*(?:[:=]|\s+)\s*(\d(?:\.\d{1,2})?)\s*(?:mg\/dl)?/i,
    unit: 'mg/dL',
    defaultRange: '0.50 - 1.10 mg/dL',
    min: 0.2,
    max: 15.0,
  },

  // 9. TSH
  {
    key: 'tsh',
    label: 'Thyroid Stimulating Hormone (TSH)',
    regex: /(?:thyroid\s*stimulating\s*hormone|tsh)\s*(?:[:=]|\s+)\s*(\d{1,2}(?:\.\d{1,3})?)\s*(?:miu\/l|uiu\/ml|u[iu]\/ml)?/i,
    unit: 'mIU/L',
    defaultRange: '0.40 - 4.50 mIU/L',
    min: 0.01,
    max: 100.0,
  },

  // 10. Hemoglobin
  {
    key: 'hemoglobin',
    label: 'Hemoglobin',
    regex: /(?:hemoglobin|hgb|hb)\s*(?:[:=]|\s+)\s*(\d{1,2}(?:\.\d{1,2})?)\s*(?:g\/dl)?/i,
    unit: 'g/dL',
    defaultRange: '12.0 - 15.5 g/dL',
    min: 4.0,
    max: 22.0,
  },

  // 11. Vitamin D
  {
    key: 'vitamin_d',
    label: 'Vitamin D (25-OH)',
    regex: /(?:vitamin\s*d(?:[,\s]*25-?\s*hydroxy)?|25-?oh\s*vitamin\s*d)\s*(?:[:=]|\s+)\s*(\d{1,3}(?:\.\d{1,2})?)\s*(?:ng\/ml)?/i,
    unit: 'ng/mL',
    defaultRange: '30 - 100 ng/mL',
    min: 4.0,
    max: 150.0,
  },

  // 12. Heart Rate / Pulse
  {
    key: 'heart_rate',
    label: 'Heart Rate',
    regex: /(?:heart\s*rate|pulse|pulse\s*rate|hr)\s*(?:[:=]|\s+)\s*(\d{2,3})\s*(?:bpm|beats\/min)?/i,
    unit: 'bpm',
    defaultRange: '60 - 100 bpm',
    min: 35,
    max: 220,
  },

  // 13. Oxygen Saturation (SpO2)
  {
    key: 'spo2',
    label: 'Oxygen Saturation (SpO2)',
    regex: /(?:oxygen\s*saturation|pulse\s*oximetry|spo2|o2\s*sat)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:%|\s*percent)?/i,
    unit: '%',
    defaultRange: '95 - 100 %',
    min: 60,
    max: 100,
  },

  // 14. Body Temperature
  {
    key: 'temperature',
    label: 'Body Temperature',
    regex: /(?:body\s*temperature|temperature|temp)\s*(?:[:=]|\s+)\s*(\d{2,3}(?:\.\d{1,2})?)\s*(?:f|c|°f|°c)?/i,
    unit: 'F',
    defaultRange: '97.0 - 99.0 F',
    min: 94.0,
    max: 106.0,
  },
];

/**
 * Extracts abnormal flags printed in lab lines.
 */
function extractAbnormalFlag(line) {
  const upper = line.toUpperCase();
  if (upper.includes('[HIGH]') || upper.includes('[ELEVATED]') || upper.includes('HIGH') && upper.includes('FLAG')) return 'HIGH';
  if (upper.includes('[LOW]') || upper.includes('[DECREASED]') || upper.includes('LOW') && upper.includes('FLAG')) return 'LOW';
  if (upper.includes('[BORDERLINE]')) return 'BORDERLINE';
  if (upper.includes('[CRITICAL]')) return 'CRITICAL';
  if (upper.includes('[NORMAL]')) return 'NORMAL';
  return 'NONE';
}

/**
 * Extracts structured measurements from raw text.
 */
function extractMeasurements(text, documentDate = null, reportId = '') {
  if (!text || typeof text !== 'string') return [];

  const found = new Map();
  const dateObj = documentDate ? new Date(documentDate) : null;
  const lines = text.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const abnormalFlag = extractAbnormalFlag(line);

    for (const def of MEASUREMENT_DEFINITIONS) {
      if (def.handler) {
        const match = def.regex.exec(line);
        if (match) {
          const results = def.handler(match, dateObj, reportId, line, abnormalFlag);
          results.forEach((item) => {
            if (!found.has(item.key)) {
              found.set(item.key, item);
            }
          });
        }
      } else {
        if (found.has(def.key)) continue;

        const match = def.regex.exec(line);
        if (match) {
          const valStr = match[1];
          const numVal = parseFloat(valStr);

          if (!isNaN(numVal) && (def.min === undefined || numVal >= def.min) && (def.max === undefined || numVal <= def.max)) {
            const rangeMatch = line.match(/(?:ref(?:erence)?\s*range|normal)?\s*(?:[:=]|\s)\s*([<>]?\s*\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)/i);
            const refRange = rangeMatch ? rangeMatch[1].trim() : def.defaultRange;

            let flag = abnormalFlag;
            if (flag === 'NONE') {
              if (def.key === 'glucose' && numVal > 100) flag = 'HIGH';
              if (def.key === 'glucose_postprandial' && numVal > 140) flag = 'HIGH';
              if (def.key === 'hba1c' && numVal > 5.7) flag = 'HIGH';
              if (def.key === 'ldl' && numVal > 100) flag = 'HIGH';
              if (def.key === 'cholesterol_total' && numVal > 200) flag = 'HIGH';
            }

            found.set(def.key, {
              key: def.key,
              label: def.label,
              rawValue: `${numVal} ${def.unit}`,
              numericValue: numVal,
              unit: def.unit,
              date: dateObj,
              referenceRange: refRange,
              abnormalFlag: flag,
              sourceSnippet: line.trim(),
              pageNumber: 1,
              reportId,
            });
          }
        }
      }
    }
  }

  return Array.from(found.values());
}

/**
 * Extracts documented medications and conditions from prescription or clinical notes.
 */
function extractMedicationsAndConditions(text) {
  if (!text || typeof text !== 'string') return { medications: [], conditions: [] };

  const medications = [];
  const conditions = [];
  const lines = text.split(/\r?\n/);

  // Common clinical condition keywords
  const conditionKeywords = [
    'Type 2 Diabetes',
    'Type 2 Diabetes Mellitus',
    'Essential Hypertension',
    'Hypertension',
    'Hyperlipidemia',
    'Dyslipidemia',
    'Vitamin D deficiency',
    'Coronary Artery Disease',
    'Asthma',
    'Chronic Kidney Disease',
  ];

  conditionKeywords.forEach((ck) => {
    if (new RegExp(`\\b${ck}\\b`, 'i').test(text)) {
      if (!conditions.includes(ck)) conditions.push(ck);
    }
  });

  // Common medication patterns
  const knownMeds = [
    { name: 'Metformin', generic: 'Metformin Hydrochloride' },
    { name: 'Lisinopril', generic: 'Lisinopril' },
    { name: 'Atorvastatin', generic: 'Atorvastatin Calcium' },
    { name: 'Spironolactone', generic: 'Spironolactone' },
    { name: 'Amlodipine', generic: 'Amlodipine Besylate' },
    { name: 'Levothyroxine', generic: 'Levothyroxine Sodium' },
    { name: 'Aspirin', generic: 'Acetylsalicylic acid' },
    { name: 'Warfarin', generic: 'Warfarin Sodium' },
    { name: 'Cholecalciferol', generic: 'Vitamin D3' },
  ];

  lines.forEach((line) => {
    knownMeds.forEach((km) => {
      const medRegex = new RegExp(`(?:\\b\\d+\\.\\s*)?(${km.name}(?:\\s+[A-Za-z]+)?)(?:\\s+(\\d+\\s*(?:mg|mcg|iu|g)))?`, 'i');
      const match = medRegex.exec(line);
      if (match && !medications.some((m) => m.name.toLowerCase() === km.name.toLowerCase())) {
        let strength = match[2] || '';
        let frequency = 'Daily';

        if (/twice\s+daily|bid/i.test(line)) frequency = 'Twice daily';
        else if (/bedtime|nightly|qhs/i.test(line)) frequency = 'Nightly at bedtime';
        else if (/once\s+daily|daily|qam/i.test(line)) frequency = 'Once daily';

        medications.push({
          name: km.name,
          genericName: km.generic,
          strength: strength || '500 mg',
          dosage: '1 tablet',
          frequency,
          route: 'Oral',
          status: 'Active',
          sourceSnippet: line.trim(),
        });
      }
    });
  });

  return { medications, conditions };
}

module.exports = {
  extractMeasurements,
  extractMedicationsAndConditions,
  MEASUREMENT_DEFINITIONS,
};
