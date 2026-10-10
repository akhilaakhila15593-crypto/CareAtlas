const mockStore = require('../database/mockStore');
const User = require('../models/User');
const Patient = require('../models/Patient');

const DEFAULT_DEMO_USERS = [
  {
    name: 'Eleanor Vance',
    email: 'eleanor@careatlas.health',
    password: 'patient123',
    role: 'patient',
    patientId: 'P-101',
    description: 'Patient Demo (Type 2 Diabetes, Hypertension, Active Alerts & Conflicts)',
  },
  {
    name: 'Marcus Chen',
    email: 'marcus@careatlas.health',
    password: 'patient123',
    role: 'patient',
    patientId: 'P-102',
    description: 'Patient Demo (Annual Wellness, Normal Baseline Vitals & Thyroid)',
  },
  {
    name: 'Dr. Sarah Jenkins, MD',
    email: 'doctor@careatlas.health',
    password: 'doctor123',
    role: 'clinician',
    patientId: 'P-101',
    description: 'Clinician / Physician Portal (Full Multi-Patient Oversight)',
  },
  {
    name: 'Health Records Admin',
    email: 'demo@careatlas.health',
    password: 'demo123',
    role: 'admin',
    patientId: 'P-101',
    description: 'Administrator Access (Governance, Audit Logs & FHIR Exports)',
  },
];

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Check in mock store / demo accounts
    let user = null;
    if (mockStore.isMockMode()) {
      user = await mockStore.findUserByEmail(cleanEmail);
    } else {
      user = await User.findOne({ email: cleanEmail }).lean();
      if (!user) {
        // Fallback to demo users in MongoDB if not yet seeded
        const defaultMatch = DEFAULT_DEMO_USERS.find((d) => d.email.toLowerCase() === cleanEmail);
        if (defaultMatch) {
          user = defaultMatch;
        }
      }
    }

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials. Please verify your email and password, or select a demo account below.',
      });
    }

    // Generate lightweight token
    const token = `careatlas-token-${Buffer.from(`${user.email}:${Date.now()}`).toString('base64')}`;

    const safeUser = {
      id: user.id || user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'patient',
      patientId: user.patientId || 'P-101',
    };

    return res.json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, email, password, role = 'patient', patientDetails } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required for registration.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    if (mockStore.isMockMode()) {
      const existing = await mockStore.findUserByEmail(cleanEmail);
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }
    } else {
      const existing = await User.findOne({ email: cleanEmail }).lean();
      if (existing) {
        return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
      }
    }

    // If role is patient, automatically create matching patient record
    let associatedPatientId = 'P-101';
    if (role === 'patient') {
      const newPatientData = {
        name,
        age: patientDetails?.age ? parseInt(patientDetails.age, 10) : 35,
        sex: patientDetails?.sex || 'Not specified',
        dateOfBirth: patientDetails?.dateOfBirth || '1990-01-01',
        notes: patientDetails?.notes || 'Registered through CareAtlas patient portal.',
        allergies: patientDetails?.allergies || [],
        activeConditions: patientDetails?.activeConditions || ['General Health Monitoring'],
        carePlan: [],
      };

      if (mockStore.isMockMode()) {
        const createdPatient = await mockStore.createPatient(newPatientData);
        associatedPatientId = createdPatient.demoId;
      } else {
        const demoId = `P-${Date.now().toString().slice(-4)}`;
        const doc = new Patient({ ...newPatientData, demoId });
        const saved = await doc.save();
        associatedPatientId = saved.demoId;
      }
    }

    const userData = {
      name,
      email: cleanEmail,
      password,
      role,
      patientId: associatedPatientId,
    };

    let createdUser = null;
    if (mockStore.isMockMode()) {
      createdUser = await mockStore.createUser(userData);
    } else {
      const doc = new User(userData);
      createdUser = await doc.save();
    }

    const token = `careatlas-token-${Buffer.from(`${createdUser.email}:${Date.now()}`).toString('base64')}`;

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      patientId: createdUser.patientId,
      user: {
        id: createdUser.id || createdUser._id,
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        patientId: createdUser.patientId,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/demo-credentials
 */
async function getDemoCredentials(req, res) {
  return res.json({
    success: true,
    data: DEFAULT_DEMO_USERS,
  });
}

module.exports = {
  login,
  register,
  getDemoCredentials,
  DEFAULT_DEMO_USERS,
};
