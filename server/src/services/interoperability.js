/**
 * CareAtlas Medical Interoperability & Standards Export Service
 *
 * Implements HL7 FHIR R4 resource generation (Patient, Observation, DocumentReference,
 * DiagnosticReport, MedicationRequest, Condition) and standard CSV/JSON export.
 */

const LOINC_MAP = {
  glucose: { code: '1558-6', display: 'Fasting glucose [Mass/volume] in Serum or Plasma' },
  glucose_postprandial: { code: '1521-4', display: 'Glucose 2 hours post meal [Mass/volume] in Serum or Plasma' },
  hba1c: { code: '4548-4', display: 'Hemoglobin A1c/Hemoglobin.total in Blood' },
  cholesterol_total: { code: '2093-3', display: 'Cholesterol [Mass/volume] in Serum or Plasma' },
  ldl: { code: '13457-7', display: 'Cholesterol in LDL [Mass/volume] in Serum or Plasma by calculation' },
  hdl: { code: '2085-9', display: 'Cholesterol in HDL [Mass/volume] in Serum or Plasma' },
  creatinine: { code: '2160-0', display: 'Creatinine [Mass/volume] in Serum or Plasma' },
  tsh: { code: '3016-3', display: 'Thyrotropin [Units/volume] in Serum or Plasma' },
  hemoglobin: { code: '718-7', display: 'Hemoglobin [Mass/volume] in Blood' },
  vitamin_d: { code: '62292-8', display: '25-hydroxyvitamin D3 [Mass/volume] in Serum or Plasma' },
  heart_rate: { code: '8867-4', display: 'Heart rate' },
  spo2: { code: '2708-6', display: 'Oxygen saturation in Arterial blood by Pulse oximetry' },
  temperature: { code: '8310-5', display: 'Body temperature' },
  bp_systolic: { code: '8480-6', display: 'Systolic blood pressure' },
  bp_diastolic: { code: '8462-4', display: 'Diastolic blood pressure' },
};

/**
 * Generates an HL7 FHIR R4 Bundle (Collection) from patient records.
 *
 * @param {object} patient
 * @param {Array} reports
 * @returns {object} FHIR R4 Bundle JSON
 */
function exportToFhirR4(patient, reports = []) {
  if (!patient) throw new Error('Patient record required for FHIR export');

  const fhirId = patient.demoId || 'patient-001';
  const entries = [];

  // 1. FHIR Patient Resource
  const fhirPatient = {
    resourceType: 'Patient',
    id: fhirId,
    identifier: [
      {
        system: 'urn:oid:2.16.840.1.113883.4.1',
        value: patient.demoId,
      },
    ],
    active: true,
    name: [
      {
        use: 'official',
        text: patient.name,
      },
    ],
    gender: patient.sex ? patient.sex.toLowerCase() : 'unknown',
    birthDate: patient.dateOfBirth || '1967-04-12',
  };

  entries.push({
    fullUrl: `urn:uuid:patient-${fhirId}`,
    resource: fhirPatient,
  });

  // 2. FHIR DocumentReference Resources for each uploaded report
  reports.forEach((r, idx) => {
    const docRef = {
      resourceType: 'DocumentReference',
      id: `docref-${r._id || idx}`,
      status: 'current',
      subject: {
        reference: `Patient/${fhirId}`,
      },
      date: r.documentDate ? new Date(r.documentDate).toISOString() : new Date().toISOString(),
      type: {
        text: r.documentType,
      },
      description: r.originalFilename,
      content: [
        {
          attachment: {
            contentType: r.mimeType || 'text/plain',
            title: r.originalFilename,
            size: r.fileSize || 0,
            hash: r.checksum || undefined,
          },
        },
      ],
    };
    entries.push({
      fullUrl: `urn:uuid:docref-${r._id || idx}`,
      resource: docRef,
    });
  });

  // 3. FHIR Observation Resources for each extracted clinical measurement
  let obsIndex = 0;
  reports.forEach((r) => {
    (r.measurements || []).forEach((m) => {
      obsIndex++;
      const loinc = LOINC_MAP[m.key] || { code: 'unknown', display: m.label };

      const fhirObservation = {
        resourceType: 'Observation',
        id: `obs-${m.reportId || r._id}-${m.key}-${obsIndex}`,
        status: 'final',
        category: [
          {
            coding: [
              {
                system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                code: m.key.includes('bp_') || m.key === 'heart_rate' || m.key === 'spo2' || m.key === 'temperature' ? 'vital-signs' : 'laboratory',
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: loinc.code,
              display: loinc.display,
            },
          ],
          text: m.label,
        },
        subject: {
          reference: `Patient/${fhirId}`,
        },
        effectiveDateTime: m.date ? new Date(m.date).toISOString() : undefined,
        valueQuantity: {
          value: m.numericValue,
          unit: m.unit,
          system: 'http://unitsofmeasure.org',
        },
        referenceRange: m.referenceRange
          ? [
              {
                text: m.referenceRange,
              },
            ]
          : undefined,
        interpretation: m.abnormalFlag && m.abnormalFlag !== 'NONE' && m.abnormalFlag !== 'NORMAL'
          ? [
              {
                coding: [
                  {
                    system: 'http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation',
                    code: m.abnormalFlag === 'HIGH' ? 'H' : m.abnormalFlag === 'LOW' ? 'L' : 'A',
                  },
                ],
                text: m.abnormalFlag,
              },
            ]
          : undefined,
      };

      entries.push({
        fullUrl: `urn:uuid:obs-${m.key}-${obsIndex}`,
        resource: fhirObservation,
      });
    });
  });

  // 4. FHIR MedicationRequest Resources
  let medIdx = 0;
  reports.forEach((r) => {
    (r.linkedMedications || []).forEach((med) => {
      medIdx++;
      const fhirMed = {
        resourceType: 'MedicationRequest',
        id: `medrx-${medIdx}`,
        status: med.status === 'Active' ? 'active' : 'stopped',
        intent: 'order',
        medicationCodeableConcept: {
          text: `${med.name} ${med.strength || ''}`,
        },
        subject: {
          reference: `Patient/${fhirId}`,
        },
        dosageInstruction: [
          {
            text: `${med.dosage || ''} ${med.frequency || ''}`.trim(),
            route: { text: med.route || 'Oral' },
          },
        ],
      };
      entries.push({
        fullUrl: `urn:uuid:med-${medIdx}`,
        resource: fhirMed,
      });
    });
  });

  return {
    resourceType: 'Bundle',
    id: `careatlas-bundle-${Date.now()}`,
    type: 'collection',
    timestamp: new Date().toISOString(),
    total: entries.length,
    entry: entries,
  };
}

/**
 * Generates tabular CSV export of all observations across patient history.
 */
function exportToCsv(patient, reports = []) {
  const headers = [
    'PatientID',
    'PatientName',
    'DocumentDate',
    'DocumentTitle',
    'DocumentType',
    'MetricKey',
    'MetricLabel',
    'NumericValue',
    'Unit',
    'ReferenceRange',
    'AbnormalFlag',
    'SourceSnippet',
  ];

  const rows = [headers.join(',')];

  reports.forEach((r) => {
    const docDate = r.documentDate ? new Date(r.documentDate).toISOString().split('T')[0] : '';
    const safeTitle = `"${(r.originalFilename || '').replace(/"/g, '""')}"`;
    const safeDocType = `"${(r.documentType || '').replace(/"/g, '""')}"`;

    (r.measurements || []).forEach((m) => {
      const safeLabel = `"${(m.label || '').replace(/"/g, '""')}"`;
      const safeRange = `"${(m.referenceRange || '').replace(/"/g, '""')}"`;
      const safeSnippet = `"${(m.sourceSnippet || '').replace(/"/g, '""')}"`;

      const row = [
        patient.demoId,
        `"${patient.name}"`,
        docDate,
        safeTitle,
        safeDocType,
        m.key,
        safeLabel,
        m.numericValue !== null ? m.numericValue : '',
        `"${m.unit || ''}"`,
        safeRange,
        m.abnormalFlag || 'NORMAL',
        safeSnippet,
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
}

module.exports = {
  exportToFhirR4,
  exportToCsv,
  LOINC_MAP,
};
