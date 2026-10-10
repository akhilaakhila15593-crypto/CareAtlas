const test = require('node:test');
const assert = require('node:assert/strict');
const mockStore = require('../src/database/mockStore');
const authController = require('../src/controllers/authController');
const patientController = require('../src/controllers/patientController');

test('Auth: should return pre-configured demo credentials', async () => {
  const req = {};
  let responseData = null;
  const res = {
    json: (data) => {
      responseData = data;
    },
    status: () => res,
  };

  await authController.getDemoCredentials(req, res, () => {});
  assert.equal(responseData.success, true);
  assert.equal(Array.isArray(responseData.data), true);
  assert.ok(responseData.data.length >= 4);

  const eleanor = responseData.data.find((u) => u.email === 'eleanor@careatlas.health');
  assert.ok(eleanor);
  assert.equal(eleanor.patientId, 'P-101');
  assert.equal(eleanor.password, 'patient123');
});

test('Auth: should successfully log in Eleanor Vance with demo credentials', async () => {
  const req = {
    body: {
      email: 'eleanor@careatlas.health',
      password: 'patient123',
    },
  };
  let responseData = null;
  const res = {
    json: (data) => {
      responseData = data;
    },
    status: () => res,
  };

  await authController.login(req, res, () => {});
  assert.equal(responseData.success, true);
  assert.ok(responseData.token);
  assert.equal(responseData.user.email, 'eleanor@careatlas.health');
  assert.equal(responseData.user.patientId, 'P-101');
});

test('Auth: should reject invalid login credentials', async () => {
  const req = {
    body: {
      email: 'eleanor@careatlas.health',
      password: 'wrongpassword',
    },
  };
  let statusResult = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusResult = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  await authController.login(req, res, () => {});
  assert.equal(statusResult, 401);
  assert.equal(responseData.success, false);
});

test('Auth: should register a new patient user and link new patient profile', async () => {
  const req = {
    body: {
      name: 'Claire Fraser',
      email: 'claire@health.example',
      password: 'password123',
      role: 'patient',
      patientDetails: {
        age: 38,
        sex: 'Female',
        notes: 'Asthma follow-up',
      },
    },
  };
  let statusResult = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusResult = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  await authController.register(req, res, () => {});
  assert.equal(statusResult, 201);
  assert.equal(responseData.success, true);
  assert.ok(responseData.patientId);
  assert.equal(responseData.user.name, 'Claire Fraser');
  assert.equal(responseData.user.email, 'claire@health.example');

  // Verify patient was created in mockStore
  const createdPatient = await mockStore.getPatientById(responseData.patientId);
  assert.ok(createdPatient);
  assert.equal(createdPatient.name, 'Claire Fraser');
  assert.equal(createdPatient.age, 38);
});

test('Patient: should create new person profile via POST /api/patients', async () => {
  const req = {
    body: {
      name: 'James Fraser',
      age: 42,
      sex: 'Male',
      dateOfBirth: '1984-06-20',
      activeConditions: ['Mild Hypertension'],
      allergies: [{ allergen: 'Penicillin', severity: 'Severe', reaction: 'Hives' }],
    },
  };
  let statusResult = 200;
  let responseData = null;
  const res = {
    status: (code) => {
      statusResult = code;
      return res;
    },
    json: (data) => {
      responseData = data;
    },
  };

  await patientController.createPatient(req, res, () => {});
  assert.equal(statusResult, 201);
  assert.equal(responseData.success, true);
  assert.ok(responseData.data.demoId);
  assert.equal(responseData.data.name, 'James Fraser');
  assert.equal(responseData.data.allergies[0].allergen, 'Penicillin');
});
