const mongoose = require('mongoose');

const MeasurementSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      index: true,
    },
    label: {
      type: String,
      required: true,
    },
    rawValue: {
      type: String,
      required: true,
    },
    numericValue: {
      type: Number,
      default: null,
    },
    unit: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      default: null,
      index: true,
    },
    referenceRange: {
      type: String,
      default: '',
    },
    abnormalFlag: {
      type: String,
      enum: ['HIGH', 'LOW', 'ELEVATED', 'BORDERLINE', 'CRITICAL', 'NORMAL', 'NONE'],
      default: 'NONE',
    },
    sourceSnippet: {
      type: String,
      default: '',
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    isCorrected: {
      type: Boolean,
      default: false,
    },
    originalValue: {
      type: String,
      default: null,
    },
    reportId: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const LinkedMedicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    genericName: { type: String, default: '' },
    strength: { type: String, default: '' },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    route: { type: String, default: 'Oral' },
    status: { type: String, enum: ['Active', 'Discontinued', 'Historical', 'Uncertain'], default: 'Active' },
    sourceSnippet: { type: String, default: '' },
  },
  { _id: false }
);

const ValidationDetailSchema = new mongoose.Schema(
  {
    rule: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, required: true },
    severity: { type: String, enum: ['Critical', 'High', 'Medium', 'Low', 'Info'], default: 'Info' },
  },
  { _id: false }
);

const AuditEntrySchema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    previousValue: { type: mongoose.Schema.Types.Mixed, default: null },
    updatedValue: { type: mongoose.Schema.Types.Mixed, default: null },
    editor: { type: String, default: 'System / User' },
    timestamp: { type: Date, default: Date.now },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const ReportSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    originalFilename: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      required: true,
    },
    documentType: {
      type: String,
      enum: [
        'Lab Report',
        'Prescription',
        'Clinic Visit Note',
        'Radiology / Imaging',
        'Discharge Summary',
        'Other',
      ],
      default: 'Other',
      index: true,
    },
    filePath: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    checksum: {
      type: String,
      default: '',
      index: true,
    },
    extractedText: {
      type: String,
      default: '',
    },
    documentDate: {
      type: Date,
      default: null,
      index: true,
    },
    sampleCollectionDate: {
      type: Date,
      default: null,
    },
    consultationDate: {
      type: Date,
      default: null,
    },
    prescriptionDate: {
      type: Date,
      default: null,
    },
    rawDateEvidence: {
      type: String,
      default: null,
    },
    extractionConfidence: {
      type: String,
      enum: ['high', 'medium', 'low', 'none'],
      default: 'none',
    },
    dateExtractionMessage: {
      type: String,
      default: '',
    },
    validationStatus: {
      type: String,
      enum: [
        'Validated',
        'Needs review',
        'Uncertain extraction',
        'Missing information',
        'Potential conflict',
        'Duplicate candidate',
        'Source verification required',
      ],
      default: 'Validated',
      index: true,
    },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'needs_review', 'corrected'],
      default: 'unverified',
    },
    validationDetails: [ValidationDetailSchema],
    measurements: [MeasurementSchema],
    linkedMedications: [LinkedMedicationSchema],
    linkedConditions: [{ type: String }],
    summary: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['mock', 'upload'],
      default: 'upload',
    },
    isSynthetic: {
      type: Boolean,
      default: true,
    },
    auditTrail: [AuditEntrySchema],
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a patient's reports by date
ReportSchema.index({ patientId: 1, documentDate: -1 });

module.exports = mongoose.model('Report', ReportSchema);
