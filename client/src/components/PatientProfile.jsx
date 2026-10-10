import React from 'react';
import {
  User,
  Shield,
  FileText,
  Activity,
  Layers,
  CheckCircle,
  AlertTriangle,
  Lock,
  Database,
  KeyRound,
} from 'lucide-react';

export default function PatientProfile({ patient, reports = [], summary }) {
  if (!patient) return null;

  const categories = [
    'Lab Report',
    'Prescription',
    'Clinic Visit Note',
    'Radiology / Imaging',
    'Discharge Summary',
    'Other',
  ];

  const categoryCounts = summary?.categoryCounts || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Patient Header Card */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#0f172a',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
              }}
            >
              {patient.name.charAt(0)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--secondary)' }}>
                  {patient.name}
                </h2>
                <span className="badge badge-synthetic">100% Synthetic Demo Subject</span>
              </div>
              <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                <span><strong>Demo ID:</strong> {patient.demoId}</span>
                <span>•</span>
                <span><strong>Age:</strong> {patient.age} years</span>
                <span>•</span>
                <span><strong>Sex:</strong> {patient.sex}</span>
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 1rem',
              textAlign: 'right',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Records Ingested
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
              {reports.length} Documents
            </div>
          </div>
        </div>

        {patient.notes && (
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>
              CLINICAL SYNOPSIS & STUDY TRACKING:
            </div>
            <p style={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6 }}>
              {patient.notes}
            </p>
          </div>
        )}
      </div>

      {/* Record Coverage Matrix */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
          <Layers size={20} color="var(--primary)" />
          Document Coverage by Category
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Auditing health document availability to ensure balanced historical records
        </p>

        <div className="grid-3">
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const hasCoverage = count > 0;

            return (
              <div
                key={cat}
                style={{
                  background: hasCoverage ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${hasCoverage ? '#bbf7d0' : '#e2e8f0'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)' }}>
                    {cat}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: hasCoverage ? '#166534' : 'var(--text-subtle)', marginTop: '0.2rem' }}>
                    {hasCoverage ? `${count} document(s) filed` : 'No documents recorded'}
                  </div>
                </div>

                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: hasCoverage ? '#dcfce7' : '#f1f5f9',
                    color: hasCoverage ? '#16a34a' : '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {hasCoverage ? <CheckCircle size={18} /> : <FileText size={16} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security & Privacy Boundaries Disclosure */}
      <div className="card">
        <h3 className="card-title" style={{ marginBottom: '0.5rem' }}>
          <Shield size={20} color="#d97706" />
          Prototype Architecture & Production Boundary Review
        </h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Mandatory health-tech compliance disclosure: Required controls before production readiness
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <KeyRound size={16} /> Authentication & Access Control
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5 }}>
              <strong>Current State:</strong> Demo operates without user login or session auth for friction-free evaluation.
              <br />
              <strong>Production Requirement:</strong> OAuth2 / OIDC authentication with mandatory MFA, clinician role-based authorization (RBAC), and session revocation.
            </p>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Database size={16} /> Tenant Isolation & Storage
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5 }}>
              <strong>Current State:</strong> Records keyed by synthetic patient ID in MongoDB or in-memory mock store.
              <br />
              <strong>Production Requirement:</strong> Encrypted S3/GCS bucket storage with KMS-managed customer keys, database row-level security (RLS), and cryptographic tenant segregation.
            </p>
          </div>

          <div
            style={{
              padding: '1rem',
              backgroundColor: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
              <Lock size={16} /> Data Governance & Auditing
            </div>
            <p style={{ fontSize: '0.8rem', color: '#78350f', lineHeight: 1.5 }}>
              <strong>Current State:</strong> Privacy-conscious Morgan logging that excludes PHI and chat query bodies.
              <br />
              <strong>Production Requirement:</strong> Immutable append-only audit trail for every document view/download, HIPAA Business Associate Agreement (BAA), retention policies, and SOC2 Type II compliance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
