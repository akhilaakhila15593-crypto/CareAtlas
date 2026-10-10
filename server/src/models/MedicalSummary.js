const mongoose = require('mongoose');

const DocumentedConditionSchema = new mongoose.Schema(
  {
    condition: { type: String, required: true },
    evidenceSnippet: { type: String, default: '' },
    sourceReportId: { type: String, default: '' },
    reportTitle: { type: String, default: '' },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const KeyObservationSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    latestValue: { type: String, required: true },
    previousValue: { type: String, default: 'N/A' },
    changeText: { type: String, default: '' },
    date: { type: Date, default: null },
    sourceTitle: { type: String, default: '' },
  },
  { _id: false }
);

const ActiveMedSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, default: '' },
    frequency: { type: String, default: '' },
    sourceTitle: { type: String, default: '' },
  },
  { _id: false }
);

const AbnormalitySchema = new mongoose.Schema(
  {
    test: { type: String, required: true },
    value: { type: String, required: true },
    refRange: { type: String, default: '' },
    severity: { type: String, default: 'Moderate' },
    sourceTitle: { type: String, default: '' },
  },
  { _id: false }
);

const FollowUpSchema = new mongoose.Schema(
  {
    recommendation: { type: String, required: true },
    sourceTitle: { type: String, default: '' },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const MedicalSummarySchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    periodCovered: {
      from: { type: Date, default: null },
      to: { type: Date, default: null },
    },
    documentsConsidered: [{ type: String }],
    documentedConditions: [DocumentedConditionSchema],
    keyObservations: [KeyObservationSchema],
    activeMedications: [ActiveMedSchema],
    recordedAllergies: [{ type: String }],
    abnormalities: [AbnormalitySchema],
    pendingFollowUps: [FollowUpSchema],
    dataGaps: [{ type: String }],
    unresolvedConflicts: [{ type: String }],
    narrativeSummary: { type: String, default: '' },
    disclaimer: {
      type: String,
      default:
        'This summary was automatically compiled from uploaded patient medical documents. It is provided for informational and clinical review support only and does not constitute a doctor-approved diagnosis or treatment plan.',
    },
  },
  {
    timestamps: true,
  }
);

MedicalSummarySchema.index({ patientId: 1, generatedAt: -1 });

module.exports = mongoose.model('MedicalSummary', MedicalSummarySchema);
