// Synthetic Seed Data for CareAtlas MVP
// DISCLAIMER: ALL PATIENTS, VALUES, DATES, AND REPORTS ARE 100% FICTIONAL & SYNTHETIC.

const crypto = require('crypto');

function computeHash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

const syntheticPatients = [
  {
    demoId: 'P-101',
    name: 'Eleanor Vance (Synthetic Demo)',
    age: 58,
    sex: 'Female',
    dateOfBirth: '1967-04-12',
    notes: 'Synthetic patient profile for Type 2 Diabetes, Essential Hypertension, and Hyperlipidemia longitudinal management tracking.',
    isSynthetic: true,
    allergies: [
      {
        allergen: 'Sulfa Drugs',
        reaction: 'Skin rash, hives (urticaria)',
        severity: 'Moderate',
        diagnosedDate: new Date('2021-05-10'),
      },
    ],
    activeConditions: [
      'Type 2 Diabetes Mellitus',
      'Essential Hypertension',
      'Hyperlipidemia',
    ],
    carePlan: [
      {
        goal: 'Maintain HbA1c < 7.0% without hypoglycemic episodes',
        targetDate: new Date('2027-04-01'),
        status: 'Active',
      },
      {
        goal: 'Systolic blood pressure target < 130 mmHg and diastolic < 80 mmHg',
        targetDate: new Date('2027-04-01'),
        status: 'Active',
      },
      {
        goal: 'Reconcile Metformin dosage conflict and monitor potassium on ACEi/diuretic therapy',
        targetDate: new Date('2026-11-15'),
        status: 'Active',
      },
    ],
  },
  {
    demoId: 'P-102',
    name: 'Marcus Chen (Synthetic Demo)',
    age: 42,
    sex: 'Male',
    dateOfBirth: '1983-09-22',
    notes: 'Synthetic patient profile for routine wellness monitoring, preventative labs, and annual checkups.',
    isSynthetic: true,
    allergies: [
      {
        allergen: 'Penicillin',
        reaction: 'Mild rash',
        severity: 'Mild',
        diagnosedDate: new Date('2015-08-20'),
      },
    ],
    activeConditions: [
      'Routine Health Maintenance',
    ],
    carePlan: [
      {
        goal: 'Maintain regular cardiovascular exercise and annual wellness labs',
        targetDate: new Date('2027-04-15'),
        status: 'Active',
      },
    ],
  },
];

const rep1Text = `=====================================================
METROPOLITAN CLINICAL LABORATORIES [SYNTHETIC DEMO REPORT]
Patient Name: Eleanor Vance    DOB: 1967-04-12
Patient ID: P-101              Sex: Female
Collection Date: 10/10/2025 08:30 AM
Report Date: 10/10/2025 14:15 PM
Ordering Clinician: Dr. Sarah Jenkins, MD
Encounter Location: Metropolitan Outpatient Lab, Suite 400
=====================================================

TEST NAME                     RESULT       REF RANGE       UNITS     STATUS
---------------------------------------------------------------------------
Hemoglobin A1c (HbA1c)        8.6          4.0 - 5.6       %         [HIGH]
Fasting Blood Glucose         186          70 - 99         mg/dL     [HIGH]
2-Hour Postprandial Glucose   254          < 140           mg/dL     [HIGH]
Total Cholesterol             212          < 200           mg/dL     [HIGH]
Serum Creatinine              0.92         0.50 - 1.10     mg/dL     [NORMAL]
Blood Pressure (Encounter)    142/90       < 120/80        mmHg      [HIGH]

Clinical Notes: Specimen collected following confirmed 10-hour fast. Fasting and postprandial glycemic parameters markedly elevated. Patient counseled on dietary adherence and diabetic medication review. Repeat glycemic panel recommended in 3 to 6 months.`;

const rep2Text = `=====================================================
VALLEY DIAGNOSTIC PATHOLOGY [SYNTHETIC DEMO REPORT]
Patient Name: Eleanor Vance    DOB: 1967-04-12
Patient ID: P-101              Sex: Female
Collection Date: 10/10/2026 09:15 AM
Report Date: 10/10/2026 15:45 PM
Ordering Provider: Dr. Sarah Jenkins, MD
Specimen ID: VDP-884920
=====================================================

TEST NAME                     RESULT       REF RANGE       UNITS     STATUS
---------------------------------------------------------------------------
Hemoglobin A1c (HbA1c)        7.2          4.0 - 5.6       %         [HIGH]
Fasting Blood Glucose         142          70 - 99         mg/dL     [HIGH]
2-Hour Postprandial Glucose   188          < 140           mg/dL     [HIGH]
Total Cholesterol             188          < 200           mg/dL     [NORMAL]
Serum Creatinine              0.90         0.50 - 1.10     mg/dL     [NORMAL]
Blood Pressure (Vitals)       128/82       < 120/80        mmHg      [BORDERLINE]

Clinical Interpretation:
Notable longitudinal improvement observed across glycemic and lipid parameters over 12-month interval.
HbA1c decreased by 1.4 percentage points (from 8.6% on 10/10/2025 to 7.2% on 10/10/2026).
Fasting blood glucose decreased by 44 mg/dL (from 186 mg/dL to 142 mg/dL).
2-hour post-meal glucose decreased by 66 mg/dL (from 254 mg/dL to 188 mg/dL).
Total cholesterol reduced from 212 mg/dL into desirable range at 188 mg/dL.
Renal function remains stable with creatinine at 0.90 mg/dL.`;

const rep3Text = `=====================================================
OAKWOOD MEDICAL CLINIC [SYNTHETIC DEMO PRESCRIPTION]
Prescription Date: 15 August 2026
Patient Name: Eleanor Vance        DOB: 1967-04-12
Patient ID: P-101                  Rx ID: RX-2026-0815A
Prescribing Physician: Dr. Sarah Jenkins, MD (NPI: 1948201948)
Clinic: Oakwood Internal Medicine, Suite 210
=====================================================

ACTIVE MEDICATIONS PRESCRIBED:

1. Metformin Hydrochloride
   Strength & Form: 500 mg oral tablet
   Directions (Sig): Take 1 tablet by mouth twice daily with meals (BID)
   Quantity: 180 tablets (90-day supply)
   Refills: 3
   Indication: Type 2 Diabetes Mellitus

2. Lisinopril
   Strength & Form: 10 mg oral tablet
   Directions (Sig): Take 1 tablet by mouth once daily in morning
   Quantity: 90 tablets (90-day supply)
   Refills: 3
   Indication: Essential Hypertension

3. Atorvastatin Calcium
   Strength & Form: 20 mg oral tablet
   Directions (Sig): Take 1 tablet by mouth once daily at bedtime
   Quantity: 90 tablets (90-day supply)
   Refills: 3
   Indication: Hyperlipidemia

Physician Signature: Dr. Sarah Jenkins, MD
Signed Date: 15 August 2026 14:00 EST`;

const rep4Text = `=====================================================
VALLEY SPECIALTY CONSULTANTS [SYNTHETIC DEMO PRESCRIPTION]
Prescription Date: 28 September 2026
Patient Name: Eleanor Vance        DOB: 1967-04-12
Patient ID: P-101                  Rx ID: RX-2026-0928S
Prescribing Clinician: Dr. Robert Keller, MD (NPI: 1083920194)
Specialty: Endocrinology & Cardiometabolic Medicine
=====================================================

UPDATED PRESCRIPTION ORDERS:

1. Metformin Hydrochloride
   Strength & Form: 1000 mg oral tablet
   Directions (Sig): Take 1 tablet by mouth twice daily with meals (BID)
   Quantity: 180 tablets (90-day supply)
   Refills: 2
   Note: Dose escalated from 500 mg BID to 1000 mg BID to accelerate glycemic control.

2. Spironolactone
   Strength & Form: 25 mg oral tablet
   Directions (Sig): Take 1 tablet by mouth once daily in morning
   Quantity: 90 tablets (90-day supply)
   Refills: 2
   Indication: Adjunctive antihypertensive therapy

WARNING / ATTENTION:
Patient is concurrently prescribed Lisinopril 10mg daily. Co-administration of Spironolactone (potassium-sparing aldosterone antagonist) with Lisinopril (ACE inhibitor) carries risk of Hyperkalemia. Monitor serum potassium and creatinine within 1-2 weeks of initiation.

Physician Signature: Dr. Robert Keller, MD
Signed Date: 28 September 2026 16:30 EST`;

const rep5Text = `=====================================================
METROPOLITAN SPECIALTY CLINIC [SCANNED CONSULTATION NOTE]
Document Date: 05 October 2026
Patient: Eleanor Vance            DOB: 1967-04-12
Encounter Type: Outpatient Endocrinology Follow-up
Attending: Dr. Michael Vance, MD
=====================================================

ENCOUNTER SUMMARY & PHYSICAL EXAM:
Vitals: BP 130/84 mmHg, HR 74 bpm regular, SpO2 98%, Temp 98.4 F.
Handwritten Clinician Notes:
"Patient seen for follow-up of diabetes and hypertension. Reviewed recent lab schedule.
[Uncertain handwriting / OCR notice: Dosage notation partially obscured in scan margin].
Discussion held regarding tolerability of Metformin dose adjustment (500mg BID vs 1000mg BID).
Ordered follow-up metabolic panel for 10/10/2026.
Recommend repeat renal panel, serum potassium check, and medication reconciliation."

OCR Engine Status: Medium confidence (handwritten notes detected). Manual verification suggested.`;

const rep6Text = `=====================================================
PRIMECARE DIAGNOSTIC LABORATORIES [SYNTHETIC DEMO REPORT]
Patient Name: Marcus Chen      Patient ID: P-102
DOB: 1983-09-22                Sex: Male
Collection Date: 04/14/2026    Report Date: 04/14/2026
Clinician: Dr. Anthony Ross, MD
=====================================================

TEST NAME                     RESULT       REF RANGE       UNITS     STATUS
---------------------------------------------------------------------------
Fasting Blood Glucose         92           70 - 99         mg/dL     [NORMAL]
Hemoglobin A1c (HbA1c)        5.3          4.0 - 5.6       %         [NORMAL]
Total Cholesterol             172          < 200           mg/dL     [NORMAL]
LDL Cholesterol               96           < 100           mg/dL     [NORMAL]
HDL Cholesterol               52           > 40            mg/dL     [NORMAL]
Triglycerides                 118          < 150           mg/dL     [NORMAL]
Serum Creatinine              0.88         0.60 - 1.20     mg/dL     [NORMAL]
TSH (Thyroid Stimulating)     1.85         0.40 - 4.50     mIU/L     [NORMAL]
Hemoglobin                    15.2         13.8 - 17.2     g/dL      [NORMAL]
Vitamin D (25-OH)             34           30 - 100        ng/mL     [NORMAL]

Summary: All standard wellness laboratory markers within normal physiological reference ranges.`;

const syntheticReports = [
  // --- Eleanor Vance (P-101) ---
  {
    _id: 'rep-syn-001',
    patientId: 'P-101',
    originalFilename: 'metabolic_lipid_panel_oct2025.txt',
    mimeType: 'text/plain',
    documentType: 'Lab Report',
    fileSize: 2180,
    checksum: computeHash(rep1Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2025-10-10T08:30:00Z'),
    sampleCollectionDate: new Date('2025-10-10T08:30:00Z'),
    rawDateEvidence: 'Collection Date: 10/10/2025 08:30 AM',
    extractionConfidence: 'high',
    dateExtractionMessage: 'Detected collection date: 10/10/2025',
    validationStatus: 'Validated',
    verificationStatus: 'verified',
    summary: 'Comprehensive lab report showing elevated HbA1c (8.6%), fasting glucose (186 mg/dL), 2-hr post-meal glucose (254 mg/dL), and total cholesterol (212 mg/dL).',
    extractedText: rep1Text,
    measurements: [
      {
        key: 'hba1c',
        label: 'Hemoglobin A1c',
        rawValue: '8.6 %',
        numericValue: 8.6,
        unit: '%',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '4.0 - 5.6 %',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Hemoglobin A1c (HbA1c) 8.6 % [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'glucose',
        label: 'Fasting Blood Glucose',
        rawValue: '186 mg/dL',
        numericValue: 186,
        unit: 'mg/dL',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '70 - 99 mg/dL',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Fasting Blood Glucose 186 mg/dL [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'glucose_postprandial',
        label: '2-Hour Postprandial Glucose',
        rawValue: '254 mg/dL',
        numericValue: 254,
        unit: 'mg/dL',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '< 140 mg/dL',
        abnormalFlag: 'HIGH',
        sourceSnippet: '2-Hour Postprandial Glucose 254 mg/dL [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'cholesterol_total',
        label: 'Total Cholesterol',
        rawValue: '212 mg/dL',
        numericValue: 212,
        unit: 'mg/dL',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '< 200 mg/dL',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Total Cholesterol 212 mg/dL [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'creatinine',
        label: 'Serum Creatinine',
        rawValue: '0.92 mg/dL',
        numericValue: 0.92,
        unit: 'mg/dL',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '0.50 - 1.10 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Serum Creatinine 0.92 mg/dL [NORMAL]',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'bp_systolic',
        label: 'Blood Pressure (Systolic)',
        rawValue: '142 mmHg',
        numericValue: 142,
        unit: 'mmHg',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '< 120 mmHg',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Blood Pressure (Encounter) 142/90 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
      {
        key: 'bp_diastolic',
        label: 'Blood Pressure (Diastolic)',
        rawValue: '90 mmHg',
        numericValue: 90,
        unit: 'mmHg',
        date: new Date('2025-10-10T08:30:00Z'),
        referenceRange: '< 80 mmHg',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Blood Pressure (Encounter) 142/90 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-001',
      },
    ],
    linkedConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Hyperlipidemia'],
    linkedMedications: [],
    validationDetails: [
      { rule: 'Physiological Bounds Check', status: 'Passed', message: 'All extracted lab values reside within biologically plausible limits.', severity: 'Info' },
      { rule: 'Demographic Check', status: 'Passed', message: 'Patient name and DOB match registered master record.', severity: 'Info' },
    ],
    auditTrail: [],
  },

  {
    _id: 'rep-syn-002',
    patientId: 'P-101',
    originalFilename: 'metabolic_lipid_followup_oct2026.txt',
    mimeType: 'text/plain',
    documentType: 'Lab Report',
    fileSize: 2450,
    checksum: computeHash(rep2Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2026-10-10T09:15:00Z'),
    sampleCollectionDate: new Date('2026-10-10T09:15:00Z'),
    rawDateEvidence: 'Collection Date: 10/10/2026 09:15 AM',
    extractionConfidence: 'high',
    dateExtractionMessage: 'Detected collection date: 10/10/2026',
    validationStatus: 'Validated',
    verificationStatus: 'verified',
    summary: 'Follow-up lab report showing marked longitudinal improvement: HbA1c reduced to 7.2% (down 1.4 percentage points), fasting glucose 142 mg/dL, 2-hr post-meal glucose 188 mg/dL.',
    extractedText: rep2Text,
    measurements: [
      {
        key: 'hba1c',
        label: 'Hemoglobin A1c',
        rawValue: '7.2 %',
        numericValue: 7.2,
        unit: '%',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '4.0 - 5.6 %',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Hemoglobin A1c (HbA1c) 7.2 % [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'glucose',
        label: 'Fasting Blood Glucose',
        rawValue: '142 mg/dL',
        numericValue: 142,
        unit: 'mg/dL',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '70 - 99 mg/dL',
        abnormalFlag: 'HIGH',
        sourceSnippet: 'Fasting Blood Glucose 142 mg/dL [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'glucose_postprandial',
        label: '2-Hour Postprandial Glucose',
        rawValue: '188 mg/dL',
        numericValue: 188,
        unit: 'mg/dL',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '< 140 mg/dL',
        abnormalFlag: 'HIGH',
        sourceSnippet: '2-Hour Postprandial Glucose 188 mg/dL [HIGH]',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'cholesterol_total',
        label: 'Total Cholesterol',
        rawValue: '188 mg/dL',
        numericValue: 188,
        unit: 'mg/dL',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '< 200 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Total Cholesterol 188 mg/dL [NORMAL]',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'creatinine',
        label: 'Serum Creatinine',
        rawValue: '0.90 mg/dL',
        numericValue: 0.90,
        unit: 'mg/dL',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '0.50 - 1.10 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Serum Creatinine 0.90 mg/dL [NORMAL]',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'bp_systolic',
        label: 'Blood Pressure (Systolic)',
        rawValue: '128 mmHg',
        numericValue: 128,
        unit: 'mmHg',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '< 120 mmHg',
        abnormalFlag: 'BORDERLINE',
        sourceSnippet: 'Blood Pressure (Vitals) 128/82 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
      {
        key: 'bp_diastolic',
        label: 'Blood Pressure (Diastolic)',
        rawValue: '82 mmHg',
        numericValue: 82,
        unit: 'mmHg',
        date: new Date('2026-10-10T09:15:00Z'),
        referenceRange: '< 80 mmHg',
        abnormalFlag: 'BORDERLINE',
        sourceSnippet: 'Blood Pressure (Vitals) 128/82 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-002',
      },
    ],
    linkedConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    linkedMedications: [],
    validationDetails: [
      { rule: 'Longitudinal Plausibility', status: 'Passed', message: 'Rate of HbA1c reduction (1.4 percentage points over 12 months) aligns with clinical expectation.', severity: 'Info' },
    ],
    auditTrail: [],
  },

  {
    _id: 'rep-syn-003',
    patientId: 'P-101',
    originalFilename: 'rx_primary_care_aug2026.txt',
    mimeType: 'text/plain',
    documentType: 'Prescription',
    fileSize: 1720,
    checksum: computeHash(rep3Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2026-08-15T14:00:00Z'),
    prescriptionDate: new Date('2026-08-15T14:00:00Z'),
    rawDateEvidence: 'Prescription Date: 15 August 2026',
    extractionConfidence: 'high',
    dateExtractionMessage: 'Detected prescription date: 15 August 2026',
    validationStatus: 'Validated',
    verificationStatus: 'verified',
    summary: 'Primary care prescription renewal: Metformin 500mg BID, Lisinopril 10mg daily, Atorvastatin 20mg daily.',
    extractedText: rep3Text,
    measurements: [],
    linkedConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension', 'Hyperlipidemia'],
    linkedMedications: [
      {
        name: 'Metformin Hydrochloride',
        genericName: 'Metformin',
        strength: '500 mg',
        dosage: '500 mg',
        frequency: 'twice daily with meals (BID)',
        route: 'Oral',
        status: 'Active',
        sourceSnippet: 'Metformin Hydrochloride 500 mg oral tablet BID',
      },
      {
        name: 'Lisinopril',
        genericName: 'Lisinopril',
        strength: '10 mg',
        dosage: '10 mg',
        frequency: 'once daily in morning',
        route: 'Oral',
        status: 'Active',
        sourceSnippet: 'Lisinopril 10 mg oral tablet once daily',
      },
      {
        name: 'Atorvastatin Calcium',
        genericName: 'Atorvastatin',
        strength: '20 mg',
        dosage: '20 mg',
        frequency: 'once daily at bedtime',
        route: 'Oral',
        status: 'Active',
        sourceSnippet: 'Atorvastatin Calcium 20 mg oral tablet once daily at bedtime',
      },
    ],
    validationDetails: [
      { rule: 'Prescription Completeness', status: 'Passed', message: 'All 3 prescribed medications specify strength, frequency, and route.', severity: 'Info' },
    ],
    auditTrail: [],
  },

  {
    _id: 'rep-syn-004',
    patientId: 'P-101',
    originalFilename: 'rx_specialist_consult_sep2026.txt',
    mimeType: 'text/plain',
    documentType: 'Prescription',
    fileSize: 1890,
    checksum: computeHash(rep4Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2026-09-28T16:30:00Z'),
    prescriptionDate: new Date('2026-09-28T16:30:00Z'),
    rawDateEvidence: 'Prescription Date: 28 September 2026',
    extractionConfidence: 'high',
    dateExtractionMessage: 'Detected prescription date: 28 September 2026',
    validationStatus: 'Potential conflict',
    verificationStatus: 'needs_review',
    summary: 'Specialist prescription introducing Metformin 1000mg BID (conflicts with 500mg from Aug 2026) and Spironolactone 25mg daily (interacts with Lisinopril 10mg).',
    extractedText: rep4Text,
    measurements: [],
    linkedConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    linkedMedications: [
      {
        name: 'Metformin Hydrochloride',
        genericName: 'Metformin',
        strength: '1000 mg',
        dosage: '1000 mg',
        frequency: 'twice daily with meals (BID)',
        route: 'Oral',
        status: 'Active',
        sourceSnippet: 'Metformin Hydrochloride 1000 mg oral tablet BID',
      },
      {
        name: 'Spironolactone',
        genericName: 'Spironolactone',
        strength: '25 mg',
        dosage: '25 mg',
        frequency: 'once daily in morning',
        route: 'Oral',
        status: 'Active',
        sourceSnippet: 'Spironolactone 25 mg oral tablet once daily',
      },
    ],
    validationDetails: [
      { rule: 'Dosage Conflict Check', status: 'Warning', message: 'Metformin strength changed from 500mg to 1000mg across prescriber records.', severity: 'High' },
      { rule: 'Drug Interaction Check', status: 'Warning', message: 'Spironolactone co-prescribed with Lisinopril carries hyperkalemia risk.', severity: 'High' },
    ],
    auditTrail: [],
  },

  {
    _id: 'rep-syn-005',
    patientId: 'P-101',
    originalFilename: 'scanned_consult_note_oct2026.txt',
    mimeType: 'text/plain',
    documentType: 'Clinic Visit Note',
    fileSize: 1620,
    checksum: computeHash(rep5Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2026-10-05T11:00:00Z'),
    consultationDate: new Date('2026-10-05T11:00:00Z'),
    rawDateEvidence: 'Document Date: 05 October 2026',
    extractionConfidence: 'medium',
    dateExtractionMessage: 'Detected document date: 05 October 2026 with medium confidence',
    validationStatus: 'Uncertain extraction',
    verificationStatus: 'needs_review',
    summary: 'Scanned clinic visit note with handwritten notations regarding glycemic control. Flagged for review due to OCR legibility check.',
    extractedText: rep5Text,
    measurements: [
      {
        key: 'bp_systolic',
        label: 'Blood Pressure (Systolic)',
        rawValue: '130 mmHg',
        numericValue: 130,
        unit: 'mmHg',
        date: new Date('2026-10-05T11:00:00Z'),
        referenceRange: '< 120 mmHg',
        abnormalFlag: 'BORDERLINE',
        sourceSnippet: 'BP 130/84 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-005',
      },
      {
        key: 'bp_diastolic',
        label: 'Blood Pressure (Diastolic)',
        rawValue: '84 mmHg',
        numericValue: 84,
        unit: 'mmHg',
        date: new Date('2026-10-05T11:00:00Z'),
        referenceRange: '< 80 mmHg',
        abnormalFlag: 'BORDERLINE',
        sourceSnippet: 'BP 130/84 mmHg',
        pageNumber: 1,
        reportId: 'rep-syn-005',
      },
      {
        key: 'heart_rate',
        label: 'Heart Rate',
        rawValue: '74 bpm',
        numericValue: 74,
        unit: 'bpm',
        date: new Date('2026-10-05T11:00:00Z'),
        referenceRange: '60 - 100 bpm',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'HR 74 bpm regular',
        pageNumber: 1,
        reportId: 'rep-syn-005',
      },
    ],
    linkedConditions: ['Type 2 Diabetes Mellitus', 'Essential Hypertension'],
    linkedMedications: [],
    validationDetails: [
      { rule: 'OCR Legibility Check', status: 'Warning', message: 'Handwritten annotations detected with low legibility in medication dosage margin.', severity: 'Medium' },
    ],
    auditTrail: [],
  },

  // --- Marcus Chen (P-102) ---
  {
    _id: 'rep-syn-006',
    patientId: 'P-102',
    originalFilename: 'annual_wellness_panel_apr2026.txt',
    mimeType: 'text/plain',
    documentType: 'Lab Report',
    fileSize: 1980,
    checksum: computeHash(rep6Text),
    source: 'mock',
    isSynthetic: true,
    documentDate: new Date('2026-04-14T08:45:00Z'),
    sampleCollectionDate: new Date('2026-04-14T08:45:00Z'),
    rawDateEvidence: 'Collection Date: 04/14/2026',
    extractionConfidence: 'high',
    dateExtractionMessage: 'Detected collection date: 04/14/2026',
    validationStatus: 'Validated',
    verificationStatus: 'verified',
    summary: 'Normal baseline annual wellness panel for Marcus Chen. Includes normal TSH (1.85 mIU/L).',
    extractedText: rep6Text,
    measurements: [
      {
        key: 'glucose',
        label: 'Fasting Blood Glucose',
        rawValue: '92 mg/dL',
        numericValue: 92,
        unit: 'mg/dL',
        date: new Date('2026-04-14T08:45:00Z'),
        referenceRange: '70 - 99 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Fasting Blood Glucose 92 mg/dL',
        pageNumber: 1,
        reportId: 'rep-syn-006',
      },
      {
        key: 'hba1c',
        label: 'Hemoglobin A1c',
        rawValue: '5.3 %',
        numericValue: 5.3,
        unit: '%',
        date: new Date('2026-04-14T08:45:00Z'),
        referenceRange: '4.0 - 5.6 %',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Hemoglobin A1c (HbA1c) 5.3 %',
        pageNumber: 1,
        reportId: 'rep-syn-006',
      },
      {
        key: 'cholesterol_total',
        label: 'Total Cholesterol',
        rawValue: '172 mg/dL',
        numericValue: 172,
        unit: 'mg/dL',
        date: new Date('2026-04-14T08:45:00Z'),
        referenceRange: '< 200 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Total Cholesterol 172 mg/dL',
        pageNumber: 1,
        reportId: 'rep-syn-006',
      },
      {
        key: 'creatinine',
        label: 'Serum Creatinine',
        rawValue: '0.88 mg/dL',
        numericValue: 0.88,
        unit: 'mg/dL',
        date: new Date('2026-04-14T08:45:00Z'),
        referenceRange: '0.60 - 1.20 mg/dL',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'Serum Creatinine 0.88 mg/dL',
        pageNumber: 1,
        reportId: 'rep-syn-006',
      },
      {
        key: 'tsh',
        label: 'Thyroid Stimulating Hormone (TSH)',
        rawValue: '1.85 mIU/L',
        numericValue: 1.85,
        unit: 'mIU/L',
        date: new Date('2026-04-14T08:45:00Z'),
        referenceRange: '0.40 - 4.50 mIU/L',
        abnormalFlag: 'NORMAL',
        sourceSnippet: 'TSH (Thyroid Stimulating) 1.85 mIU/L',
        pageNumber: 1,
        reportId: 'rep-syn-006',
      },
    ],
    linkedConditions: ['Routine Health Maintenance'],
    linkedMedications: [],
    validationDetails: [
      { rule: 'Physiological Bounds Check', status: 'Passed', message: 'All values within standard healthy ranges.', severity: 'Info' },
    ],
    auditTrail: [],
  },
];

module.exports = {
  syntheticPatients,
  syntheticReports,
};
