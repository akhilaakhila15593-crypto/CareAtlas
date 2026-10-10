import React from 'react';
import {
  Activity,
  User,
  Database,
  Cpu,
  ShieldAlert,
  Sparkles,
  UserPlus,
  LogIn,
  LogOut,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar({
  patients = [],
  selectedPatientId,
  onSelectPatient,
  onOpenNewPatient,
  currentUser,
  onOpenLogin,
  onLogout,
  dbStatus,
  cloudConsent,
  onToggleCloudConsent,
  onOpenDisclaimer,
}) {
  const currentPatient = patients.find((p) => p.demoId === selectedPatientId) || patients[0];

  return (
    <header className="top-navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <div className="nav-brand">
          <div className="brand-icon">
            <Activity size={22} />
          </div>
          <div>
            <div className="brand-title">
              CareAtlas
              <span className="badge badge-synthetic">Health Copilot</span>
            </div>
            <div className="brand-subtitle">
              Patient Record Intelligence & Dashboard
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {/* Storage Mode Badge */}
          <div
            className="badge badge-mode"
            title={dbStatus?.mode || 'In-Memory Storage'}
          >
            <Database size={13} />
            <span>{dbStatus?.isConnected ? 'MongoDB Active' : 'In-Memory Mock Mode'}</span>
          </div>

          {/* Cloud AI Toggle */}
          <button
            onClick={onToggleCloudConsent}
            className="badge"
            style={{
              backgroundColor: cloudConsent ? '#ecfdf5' : '#f1f5f9',
              color: cloudConsent ? '#047857' : '#64748b',
              border: `1px solid ${cloudConsent ? '#a7f3d0' : '#cbd5e1'}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={
              cloudConsent
                ? 'External Cloud AI opted-in for this session (strict record evidence only)'
                : 'Local deterministic record search active (100% offline, zero data leaves server)'
            }
          >
            <Cpu size={13} />
            <span>{cloudConsent ? 'Cloud AI: Opted-In' : 'AI: Local Offline'}</span>
          </button>

          {/* Patient Selector with Add Person Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div className="patient-select-wrapper">
              <User size={16} color="var(--primary)" />
              <select
                className="patient-select"
                value={selectedPatientId || ''}
                onChange={(e) => onSelectPatient(e.target.value)}
                aria-label="Select Patient Profile"
              >
                {patients.map((p) => (
                  <option key={p.demoId} value={p.demoId}>
                    {p.name} ({p.sex}, {p.age}y)
                  </option>
                ))}
              </select>
            </div>

            {/* Add Person / Patient Button */}
            <button
              onClick={onOpenNewPatient}
              className="btn btn-outline btn-sm"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                backgroundColor: 'var(--bg-card)',
                padding: '0.45rem 0.65rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--primary)',
                borderColor: 'var(--primary)',
              }}
              title="Add New Person / Patient Profile"
            >
              <UserPlus size={14} />
              <span>+ Add Person</span>
            </button>
          </div>

          {/* Authentication Badge & Switcher */}
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                backgroundColor: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '0.35rem 0.65rem',
                fontSize: '0.8rem',
              }}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                }}
              >
                {currentUser.name ? currentUser.name.charAt(0) : 'U'}
              </div>
              <div>
                <strong style={{ color: 'var(--secondary)' }}>{currentUser.name}</strong>
                <span className="badge badge-neutral" style={{ marginLeft: '0.35rem', fontSize: '0.68rem', padding: '1px 5px' }}>
                  {currentUser.role}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sign out of CareAtlas"
                style={{
                  marginLeft: '0.25rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
            >
              <LogIn size={14} />
              <span>Sign In / Demo</span>
            </button>
          )}

          {/* Privacy Disclaimer Trigger */}
          <button
            onClick={onOpenDisclaimer}
            className="btn btn-outline btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="View Health Data & Privacy Disclaimers"
          >
            <ShieldAlert size={14} color="#d97706" />
            <span>Disclaimers</span>
          </button>
        </div>
      </div>
    </header>
  );
}
