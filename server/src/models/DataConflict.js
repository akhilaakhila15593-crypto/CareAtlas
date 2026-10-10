const mongoose = require('mongoose');

const ConflictSourceSchema = new mongoose.Schema(
  {
    reportId: { type: String, required: true },
    title: { type: String, required: true },
    date: { type: Date, default: null },
    value: { type: String, required: true },
    location: { type: String, default: '' },
  },
  { _id: false }
);

const DataConflictSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    conflictKey: {
      type: String,
      required: true,
      index: true,
    },
    field: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['Medication', 'Demographics', 'Lab Result', 'Allergy', 'Date'],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['Critical', 'High', 'Medium', 'Low'],
      default: 'Medium',
      index: true,
    },
    sourceA: ConflictSourceSchema,
    sourceB: ConflictSourceSchema,
    explanation: {
      type: String,
      required: true,
    },
    recommendedAction: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['unresolved', 'reviewed', 'corrected', 'not_a_conflict'],
      default: 'unresolved',
      index: true,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

DataConflictSchema.index({ patientId: 1, status: 1 });

module.exports = mongoose.model('DataConflict', DataConflictSchema);
