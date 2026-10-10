const mongoose = require('mongoose');

const SourceRecordRefSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, default: null },
  },
  { _id: false }
);

const HealthAlertSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    alertKey: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: [
        'Abnormal Result',
        'Medication Safety',
        'Data Conflict',
        'Follow-up Due',
        'Extraction Warning',
        'Care Gap',
      ],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['Urgent review', 'Important', 'Needs review', 'Information'],
      default: 'Needs review',
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    triggeringEvidence: {
      type: String,
      default: '',
    },
    sourceRecords: [SourceRecordRefSchema],
    recommendedAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'acknowledged', 'dismissed', 'resolved'],
      default: 'active',
      index: true,
    },
    dismissReason: {
      type: String,
      default: '',
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

HealthAlertSchema.index({ patientId: 1, status: 1, priority: 1 });

module.exports = mongoose.model('HealthAlert', HealthAlertSchema);
