import React from 'react';
import { ShieldAlert, AlertTriangle, X, CheckCircle, Lock } from 'lucide-react';

export default function DisclaimerBanner({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.75rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <ShieldAlert size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--secondary)' }}>
                CareAtlas Security & Medical Disclaimer
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Prototype Hackathon / Educational Demonstration Notice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '0.35rem',
              borderRadius: '50%',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              color: '#991b1b',
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <AlertTriangle size={16} /> NOT A MEDICAL DEVICE / NOT CLINICAL ADVICE
            </div>
            CareAtlas is an experimental health-record organizer and research prototype. It does not provide medical diagnoses, treatment decisions, prescriptions, or clinical advice. Always consult a licensed healthcare provider for personal health concerns or emergencies.
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}
          >
            <h4 style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={16} color="var(--primary)" /> Synthetic Data Guarantee
            </h4>
            <p>
              All sample patient profiles (e.g. Eleanor Vance, Marcus Chen), laboratory numbers, medical documents, and doctor prescriptions included in this software are <strong>100% fictional and synthetically generated</strong>. No real-world Protected Health Information (PHI) is contained in any fixture.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.4rem' }}>
              Missing Production Controls (Demo Boundaries)
            </h4>
            <p style={{ marginBottom: '0.5rem' }}>
              Before any health record system can be deployed in clinical practice, the following controls are legally and architecturally required:
            </p>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>User Authentication & Authorization:</strong> Multi-factor login, RBAC (Role-Based Access Control) for patients and clinicians.</li>
              <li><strong>Tenant & Patient Isolation:</strong> Strict multi-tenant cryptographic partition.</li>
              <li><strong>Encryption:</strong> Mandatory AES-256 at rest and TLS 1.3 in transit with HSM key management.</li>
              <li><strong>HIPAA / GDPR / Legal Review:</strong> Business Associate Agreements (BAAs), audit logging, breach notification protocol.</li>
              <li><strong>Auditable Consent Trails:</strong> Granular opt-in tracking for medical records and AI processing.</li>
              <li><strong>Secure File Quarantine:</strong> Antivirus scanning and automated malware detonation before text parsing.</li>
            </ul>
          </div>

          <div
            style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              color: '#166534',
            }}
          >
            <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
              <CheckCircle size={16} /> Built-in Privacy Protections in this MVP
            </div>
            <ul style={{ paddingLeft: '1.25rem' }}>
              <li>Zero medical text or full chat queries logged to server console/files.</li>
              <li>Zero external cloud AI transmission by default — runs 100% locally and offline unless explicit per-session consent is granted.</li>
              <li>Strict patient-specific evidence retrieval barrier.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-primary">
            I Understand & Accept
          </button>
        </div>
      </div>
    </div>
  );
}
