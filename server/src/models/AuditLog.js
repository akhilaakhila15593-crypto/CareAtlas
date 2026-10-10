const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        'DOCUMENT_VIEW',
        'DOCUMENT_UPLOAD',
        'DOCUMENT_DELETE',
        'RECORD_CORRECTION',
        'CONFLICT_RESOLVED',
        'ALERT_ACKNOWLEDGED',
        'DATA_EXPORT_FHIR',
        'DATA_EXPORT_JSON',
        'DATA_EXPORT_CSV',
        'SUMMARY_REGENERATED',
      ],
      required: true,
      index: true,
    },
    performedBy: {
      type: String,
      default: 'Authorized User',
    },
    targetId: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

AuditLogSchema.index({ patientId: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
