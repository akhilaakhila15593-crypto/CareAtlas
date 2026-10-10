const mongoose = require('mongoose');

const AllergySchema = new mongoose.Schema(
  {
    allergen: { type: String, required: true },
    reaction: { type: String, default: 'Unspecified reaction' },
    severity: { type: String, enum: ['Mild', 'Moderate', 'Severe', 'Life-threatening'], default: 'Moderate' },
    diagnosedDate: { type: Date, default: null },
  },
  { _id: false }
);

const CarePlanItemSchema = new mongoose.Schema(
  {
    goal: { type: String, required: true },
    targetDate: { type: Date, default: null },
    status: { type: String, enum: ['Active', 'Pending', 'Achieved'], default: 'Active' },
  },
  { _id: false }
);

const PatientSchema = new mongoose.Schema(
  {
    demoId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: String,
      default: '1967-04-12',
    },
    age: {
      type: Number,
      required: true,
    },
    sex: {
      type: String,
      enum: ['Female', 'Male', 'Other', 'Not specified'],
      default: 'Not specified',
    },
    notes: {
      type: String,
      default: '',
    },
    allergies: [AllergySchema],
    activeConditions: [{ type: String }],
    carePlan: [CarePlanItemSchema],
    isSynthetic: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Patient', PatientSchema);
