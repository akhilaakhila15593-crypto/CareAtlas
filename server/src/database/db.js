const mongoose = require('mongoose');
const config = require('../config');
const mockStore = require('./mockStore');
const Patient = require('../models/Patient');
const Report = require('../models/Report');
const { syntheticPatients, syntheticReports } = require('../seeds/syntheticData');

let isConnected = false;

async function connectDB() {
  if (!config.mongoUri) {
    console.log('ℹ️  No MONGODB_URI provided in environment. Running in [In-Memory Mock Storage Mode].');
    mockStore.setMockMode(true);
    return false;
  }

  try {
    console.log(`⏳ Connecting to MongoDB at ${config.mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}...`);
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 4000,
    });
    isConnected = true;
    mockStore.setMockMode(false);
    console.log('✅ MongoDB connected successfully! Running in [Persistent Database Mode].');

    // Seed synthetic data if empty
    await seedMongoIfEmpty();
    return true;
  } catch (error) {
    console.warn(`⚠️  MongoDB connection failed (${error.message}). Falling back to [In-Memory Mock Storage Mode].`);
    isConnected = false;
    mockStore.setMockMode(true);
    return false;
  }
}

async function seedMongoIfEmpty() {
  try {
    const patientCount = await Patient.countDocuments();
    if (patientCount === 0) {
      console.log('🌱 Seeding synthetic patients to MongoDB...');
      await Patient.insertMany(syntheticPatients);
    }

    const reportCount = await Report.countDocuments();
    if (reportCount === 0) {
      console.log('🌱 Seeding synthetic reports to MongoDB...');
      await Report.insertMany(syntheticReports);
    }
  } catch (err) {
    console.error('Error seeding MongoDB:', err.message);
  }
}

function getDatabaseStatus() {
  return {
    isConnected,
    mode: isConnected ? 'MongoDB (Persistent)' : 'In-Memory Mock Storage (Demo Mode)',
    uri: config.mongoUri ? 'Configured' : 'None',
  };
}

module.exports = {
  connectDB,
  getDatabaseStatus,
};
