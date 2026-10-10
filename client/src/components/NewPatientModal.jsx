import React, { useState } from 'react';
import {
  UserPlus,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Heart,
  Calendar,
  Save,
} from 'lucide-react';
import { api } from '../services/api';

export default function NewPatientModal({
  isOpen,
  onClose,
  onPatientCreated,
}) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [notes, setNotes] = useState('');
  const [activeConditions, setActiveConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [initialFile, setInitialFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Person name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create Patient
      const parsedAge = age ? parseInt(age, 10) : 40;
      const parsedConditions = activeConditions
        ? activeConditions.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
      const parsedAllergies = allergies
        ? allergies.split(',').map((a) => ({
            allergen: a.trim(),
            reaction: 'Documented sensitivity',
            severity: 'Moderate',
          }))
        : [];

      const res = await api.createPatient({
        name: name.trim(),
        age: parsedAge,
        sex,
        dateOfBirth: dateOfBirth || '1985-01-01',
        notes: notes.trim(),
        activeConditions: parsedConditions.length > 0 ? parsedConditions : ['General Health Monitoring'],
        allergies: parsedAllergies,
      });

      const newPatient = res.data;

      // 2. If initial file was selected, upload it immediately under this patient's ID
      if (initialFile && newPatient?.demoId) {
        const formData = new FormData();
        formData.append('file', initialFile);
        formData.append('patientId', newPatient.demoId);
        formData.append('documentType', 'Auto-detect');
        try {
          await api.uploadReport(formData);
        } catch (uploadErr) {
          console.warn('Initial file upload warning:', uploadErr.message);
        }
      }

      // Notify parent to switch dashboard to this particular person
      onPatientCreated(newPatient);
      onClose();
    } catch (err) {
      console.error('Error creating patient:', err);
      setError(err.message || 'Failed to create patient profile');
    } finally {
      setLoading(false);
    }
  };

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
          maxWidth: '540px',
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.75rem',
          maxHeight: '92vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserPlus size={22} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--secondary)' }}>
                Add Person & Initialize Dashboard
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Enter person details to display their dedicated health record dashboard
              </p>
            </div>
          </div>

          <button onClick={onClose} style={{ color: 'var(--text-subtle)', padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Person / Patient Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. David Miller, Priya Sharma"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Age
              </label>
              <input
                type="number"
                min="0"
                max="125"
                placeholder="e.g. 52"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Sex / Gender
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Active Conditions / Diagnoses (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
              value={activeConditions}
              onChange={(e) => setActiveConditions(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Known Allergies (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Penicillin, Peanuts, Sulfa"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
              Clinical History & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Describe baseline clinical history, physician notes, or reason for monitoring..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '0.55rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontSize: '0.88rem' }}
            />
          </div>

          {/* Optional: Upload initial report at same time */}
          <div style={{ backgroundColor: 'var(--bg-muted)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border)' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', marginBottom: '0.35rem' }}>
              Optional: Upload Initial Medical Report / Prescription for this Person
            </label>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg"
              onChange={(e) => setInitialFile(e.target.files?.[0] || null)}
              style={{ fontSize: '0.82rem' }}
            />
            {initialFile && (
              <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                Selected: {initialFile.name} ({(initialFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <Save size={16} />
              <span>{loading ? 'Registering...' : 'Save Person & Show on Dashboard'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
