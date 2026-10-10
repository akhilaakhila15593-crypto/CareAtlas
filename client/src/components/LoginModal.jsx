import React, { useState, useEffect } from 'react';
import {
  Lock,
  User,
  Mail,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  UserPlus,
  LogIn,
  X,
  Stethoscope,
  Heart,
} from 'lucide-react';
import { api } from '../services/api';

export default function LoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'demo' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState([]);

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAge, setRegAge] = useState('45');
  const [regSex, setRegSex] = useState('Female');
  const [regDob, setRegDob] = useState('1981-05-15');
  const [regNotes, setRegNotes] = useState('Patient seeking longitudinal health monitoring and record management.');

  useEffect(() => {
    loadDemoCredentials();
  }, []);

  const loadDemoCredentials = async () => {
    try {
      const res = await api.getDemoCredentials();
      setDemoUsers(res.data || []);
    } catch (err) {
      console.warn('Could not fetch demo credentials:', err.message);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email, password });
      onLoginSuccess(res.user);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.login({ email: user.email, password: user.password });
      onLoginSuccess(res.user);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword) return;

    setLoading(true);
    setError(null);
    try {
      const res = await api.register({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        role: 'patient',
        patientDetails: {
          age: parseInt(regAge, 10),
          sex: regSex,
          dateOfBirth: regDob,
          notes: regNotes,
          activeConditions: [regNotes.split('.')[0] || 'General Health'],
        },
      });

      onLoginSuccess(res.user);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '520px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.75rem',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Lock size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>
                CareAtlas Authentication
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Access patient health records & clinical intelligence
              </p>
            </div>
          </div>

          {onClose && (
            <button onClick={onClose} style={{ color: 'var(--text-subtle)', padding: '0.25rem' }}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--bg-muted)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            border: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'login' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'login' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('demo'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'demo' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'demo' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'demo' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            1-Click Demo Logins
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.45rem',
              fontSize: '0.82rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
              backgroundColor: activeTab === 'register' ? 'var(--bg-card)' : 'transparent',
              color: activeTab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: activeTab === 'register' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            Register Patient
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '0.65rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              color: '#991b1b',
              fontSize: '0.82rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Tab 1: Standard Login Form */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="email"
                  required
                  placeholder="e.g. eleanor@careatlas.health"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Key size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                <input
                  type="password"
                  required
                  placeholder="Enter password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    outline: 'none',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem',
                marginTop: '0.5rem',
                fontWeight: 600,
              }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In to Dashboard'}</span>
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
              <button
                type="button"
                onClick={() => setActiveTab('demo')}
                style={{ fontSize: '0.8rem', color: 'var(--primary)', textDecoration: 'underline' }}
              >
                Or use pre-configured 1-click demo accounts
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: 1-Click Demo Accounts */}
        {activeTab === 'demo' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Select any role or patient to sign in immediately and view their dedicated health dashboard:
            </p>

            {demoUsers.map((user, idx) => (
              <div
                key={idx}
                onClick={() => handleQuickLogin(user)}
                style={{
                  backgroundColor: 'var(--bg-muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                    {user.role === 'clinician' ? (
                      <Stethoscope size={16} color="var(--primary)" />
                    ) : (
                      <Heart size={16} color="var(--accent)" />
                    )}
                    <strong style={{ fontSize: '0.92rem', color: 'var(--secondary)' }}>
                      {user.name}
                    </strong>
                    <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                      {user.role}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Email: <code>{user.email}</code> • Pass: <code>{user.password}</code>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '0.2rem' }}>
                    {user.description}
                  </div>
                </div>

                <ArrowRight size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* Tab 3: Register New Patient */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Enter the person's details to register their patient profile and open their personalized dashboard:
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe, Sarah Connor"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Set password..."
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={regAge}
                  onChange={(e) => setRegAge(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Sex
                </label>
                <select
                  value={regSex}
                  onChange={(e) => setRegSex(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
                Health Conditions / Clinical Notes
              </label>
              <textarea
                rows={2}
                value={regNotes}
                onChange={(e) => setRegNotes(e.target.value)}
                placeholder="e.g. Type 2 Diabetes, Asthma, Routine Checkups..."
                style={{ width: '100%', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.85rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.65rem',
                marginTop: '0.25rem',
                fontWeight: 600,
              }}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Creating Profile...' : 'Register & Open Person Dashboard'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
