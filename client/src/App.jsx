import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  FileSearch,
  TrendingUp,
  FileCheck,
  ShieldCheck,
  GitMerge,
  Pill,
  Bell,
  MessageSquare,
  Clock,
  Share2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MedicalRecords from './components/MedicalRecords';
import DocumentIntelligence from './components/DocumentIntelligence';
import HealthTrends from './components/HealthTrends';
import MedicalSummaryView from './components/MedicalSummaryView';
import DataValidationView from './components/DataValidationView';
import DataConflictsView from './components/DataConflictsView';
import MedicationSafetyView from './components/MedicationSafetyView';
import HealthAlertsView from './components/HealthAlertsView';
import HealthChat from './components/HealthChat';
import PatientHistoryTimeline from './components/PatientHistoryTimeline';
import PrivacySettingsView from './components/PrivacySettingsView';
import DisclaimerBanner from './components/DisclaimerBanner';
import LoginModal from './components/LoginModal';
import NewPatientModal from './components/NewPatientModal';
import { api } from './services/api';

export default function App() {
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('P-101');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [reports, setReports] = useState([]);
  const [dbStatus, setDbStatus] = useState(null);
  const [cloudConsent, setCloudConsent] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authentication & New Patient modal state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const stored = localStorage.getItem('careatlas_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isNewPatientOpen, setIsNewPatientOpen] = useState(false);

  // Initial load
  useEffect(() => {
    loadInitialData();
  }, []);

  // When patient changes, reload patient data
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [patientsRes, healthRes] = await Promise.all([
        api.getPatients(),
        api.getHealth(),
      ]);

      const patientList = patientsRes.data || [];
      setPatients(patientList);
      setDbStatus(healthRes.database);

      const targetId = currentUser?.patientId || (patientList.length > 0 ? patientList[0].demoId : 'P-101');
      setSelectedPatientId(targetId);
      await loadPatientDetails(targetId);
    } catch (err) {
      setError(`Failed to initialize CareAtlas: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPatientDetails = async (patientId) => {
    try {
      const [dashRes, repRes] = await Promise.all([
        api.getPatientDashboard(patientId),
        api.getReports(patientId),
      ]);
      setDashboardData(dashRes.data);
      setReports(repRes.data || []);
    } catch (err) {
      console.error('Error loading patient details:', err);
      setError(`Failed to load patient records: ${err.message}`);
    }
  };

  const handleRefresh = () => {
    if (selectedPatientId) {
      loadPatientDetails(selectedPatientId);
    }
  };

  const handleLoginSuccess = async (user) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('careatlas_user', JSON.stringify(user));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }

    try {
      const patientsRes = await api.getPatients();
      const list = patientsRes.data || [];
      setPatients(list);
    } catch (e) {
      console.warn('Failed to refresh patients list:', e);
    }

    if (user.patientId) {
      setSelectedPatientId(user.patientId);
      setActiveTab('dashboard');
      await loadPatientDetails(user.patientId);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('careatlas_user');
    } catch (e) {
      console.warn('LocalStorage remove failed:', e);
    }
  };

  const handlePatientCreated = async (newPatient) => {
    if (!newPatient) return;
    setPatients((prev) => {
      const exists = prev.some((p) => p.demoId === newPatient.demoId);
      if (exists) {
        return prev.map((p) => (p.demoId === newPatient.demoId ? newPatient : p));
      }
      return [newPatient, ...prev];
    });

    setSelectedPatientId(newPatient.demoId);
    setActiveTab('dashboard');
    await loadPatientDetails(newPatient.demoId);
  };

  const currentPatient =
    patients.find((p) => p.demoId === selectedPatientId) || patients[0];

  const navigationTabs = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'records', label: `Records (${reports.length})`, icon: FileText },
    { id: 'investigate', label: 'Doc Intelligence', icon: FileSearch },
    { id: 'trends', label: 'Trends & Compare', icon: TrendingUp },
    { id: 'summary', label: 'Clinical Summary', icon: FileCheck },
    { id: 'validation', label: 'Validation', icon: ShieldCheck },
    { id: 'conflicts', label: 'Data Conflicts', icon: GitMerge },
    { id: 'medications', label: 'Med Safety', icon: Pill },
    { id: 'alerts', label: 'Health Alerts', icon: Bell },
    { id: 'chat', label: 'AI Copilot', icon: MessageSquare },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'privacy', label: 'FHIR & Export', icon: Share2 },
  ];

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        patients={patients}
        selectedPatientId={selectedPatientId}
        onSelectPatient={(id) => setSelectedPatientId(id)}
        onOpenNewPatient={() => setIsNewPatientOpen(true)}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
        dbStatus={dbStatus}
        cloudConsent={cloudConsent}
        onToggleCloudConsent={() => setCloudConsent(!cloudConsent)}
        onOpenDisclaimer={() => setIsDisclaimerOpen(true)}
      />

      {/* Main Container */}
      <main className="main-content">
        {/* Navigation Tabs Bar */}
        <div
          className="tabs-nav"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            padding: '0.5rem',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {navigationTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn ${isActive ? 'active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.55rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-muted)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <IconComponent size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: '#991b1b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <RefreshCw size={13} /> Retry
            </button>
          </div>
        )}

        {/* Active Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            dashboardData={dashboardData}
            loading={isLoading}
            error={error}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'records' && (
          <MedicalRecords
            patientId={selectedPatientId}
            patientName={currentPatient?.name}
            reports={reports}
            loading={isLoading}
            onRefresh={handleRefresh}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onOpenNewPatient={() => setIsNewPatientOpen(true)}
          />
        )}

        {activeTab === 'investigate' && (
          <DocumentIntelligence
            reports={reports}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'trends' && (
          <HealthTrends
            patientId={selectedPatientId}
            reports={reports}
          />
        )}

        {activeTab === 'summary' && (
          <MedicalSummaryView
            patientId={selectedPatientId}
          />
        )}

        {activeTab === 'validation' && (
          <DataValidationView
            patientId={selectedPatientId}
            reports={reports}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'conflicts' && (
          <DataConflictsView
            patientId={selectedPatientId}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'medications' && (
          <MedicationSafetyView
            patientId={selectedPatientId}
          />
        )}

        {activeTab === 'alerts' && (
          <HealthAlertsView
            patientId={selectedPatientId}
            onRefresh={handleRefresh}
          />
        )}

        {activeTab === 'chat' && currentPatient && (
          <HealthChat
            patient={currentPatient}
            cloudConsent={cloudConsent}
            onToggleCloudConsent={() => setCloudConsent(!cloudConsent)}
            onNavigateToUpload={() => setActiveTab('records')}
          />
        )}

        {activeTab === 'timeline' && (
          <PatientHistoryTimeline
            patientId={selectedPatientId}
          />
        )}

        {activeTab === 'privacy' && (
          <PrivacySettingsView
            patientId={selectedPatientId}
            cloudConsent={cloudConsent}
            onToggleCloudConsent={() => setCloudConsent(!cloudConsent)}
            dbStatus={dbStatus}
          />
        )}
      </main>

      {/* Login & Demo Credentials Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Add New Person / Patient Profile Modal */}
      <NewPatientModal
        isOpen={isNewPatientOpen}
        onClose={() => setIsNewPatientOpen(false)}
        onPatientCreated={handlePatientCreated}
      />

      {/* Privacy & Medical Disclaimer Modal */}
      <DisclaimerBanner
        isOpen={isDisclaimerOpen}
        onClose={() => setIsDisclaimerOpen(false)}
      />
    </div>
  );
}
