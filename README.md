# CareAtlas — Patient Health Copilot (MERN MVP)

CareAtlas is a comprehensive, production-grade clinical health-record organizer and assistant built using the **MERN stack** (MongoDB, Express, React, Node.js). It ingests historical medical records, laboratory reports, doctor prescriptions, and clinical visit notes; extracts textual content; reliably detects document dates; captures standardized vital and lab metrics; visualizes longitudinal measurement trends; resolves cross-report discrepancies; flags drug-drug interactions; exports HL7 FHIR R4 bundles; and answers patient-specific health queries with strict evidence grounding and bracketed citations.

---

## ⚠️ Important Medical & Privacy Disclaimers

> **1. NOT A MEDICAL DEVICE / NOT CLINICAL ADVICE:**  
> CareAtlas is an informational record organizer and prototype application. It does not provide medical diagnoses, treatment decisions, drug prescriptions, or clinical advice. Never disregard professional medical advice or delay seeking care because of information displayed in this application. For any medical emergency or severe symptoms, immediately contact local emergency services (e.g., 911) or a qualified physician.

> **2. 100% SYNTHETIC & FICTIONAL DATA:**  
> All sample patient profiles (e.g., *Eleanor Vance*, *Marcus Chen*), clinical documents, dates, and laboratory figures included in this repository and demo fixtures are **100% fictional and synthetically generated**. No real Protected Health Information (PHI) is used.

> **3. DEMO BOUNDARIES & MISSING PRODUCTION CONTROLS:**  
> This software is an MVP designed for research, educational, and hackathon evaluation. Before any healthcare platform can be deployed in clinical environments, the following controls are mandatory:
> - **Authentication & Authorization:** User login with Multi-Factor Authentication (MFA), OAuth2/OIDC, and Role-Based Access Control (RBAC).
> - **Tenant & Patient Cryptographic Segregation:** Row-level security and strict partition per patient/clinic.
> - **Encryption:** AES-256 at rest, TLS 1.3 in transit with Hardware Security Module (HSM) key management.
> - **Auditing & Regulatory Review:** Immutable append-only audit logging for every document access, HIPAA Business Associate Agreements (BAAs), SOC2 Type II compliance, and jurisdiction-specific health privacy legal review.
> - **File Quarantine & Detonation:** Automated antivirus and malware scanning on all incoming uploads.

---

## 🌟 The 12 Connected User Views

1. **Health Dashboard (`Dashboard.jsx`):**
   - Key patient vital signs/lab cards with normal/high status indicators.
   - Quick clinical intelligence jump cards (Trends, Intelligence, Conflicts, Medications, Alerts, Summary, Timeline, Privacy/FHIR).
   - Recent document timeline and latest dated metrics.

2. **Medical Records (`MedicalRecords.jsx`):**
   - Multi-format drag-and-drop file upload (PDF, DOCX, TXT, CSV, PNG, JPG/JPEG).
   - Document type filters, search, validation badges, SHA-256 preview, and duplicate file warnings.

3. **Document Intelligence (`DocumentIntelligence.jsx`):**
   - Real document investigation with side-by-side split pane (Original raw document text on left, structured clinical entities on right).
   - Provenance metadata, extraction confidence, and validation checklists.
   - **Inline Measurement Correction Modal:** Allows calibrated edits to any extracted value with clinical justification and audit logging.

4. **Health Trend Analysis (`HealthTrends.jsx`):**
   - Time-window filtering (1 Month, 3 Months, 6 Months, 1 Year, All Time).
   - Interactive SVG line charts with reference range markers.
   - Earliest vs. latest vs. previous observations with **percentage points precision** (`-1.4 percentage points` for HbA1c).
   - **Direct Report-to-Report Cross-Comparison Tool:** Select any two dated reports for side-by-side variance analysis.

5. **Medical Summary (`MedicalSummaryView.jsx`):**
   - Longitudinal narrative clinical synthesis.
   - Period covered date range and documents synthesized.
   - Documented conditions with evidence citations.
   - Key observations with longitudinal trajectories, active medications, recorded allergies, and untracked diagnostic gaps.
   - "Regenerate Summary" action.

6. **Medical Data Validation (`DataValidationView.jsx`):**
   - Quality breakdown cards: Validated, Needs Review, Uncertain Extraction, Potential Conflict, Duplicate Candidate.
   - Diagnostic gaps & missing record action tasks.
   - Biological plausibility bounds reference table.

7. **Data Conflicts (`DataConflictsView.jsx`):**
   - Automated detection of cross-report contradictions (e.g., Metformin 500mg BID vs 1000mg BID).
   - Side-by-side Source A vs Source B comparison cards.
   - Conflict resolution workflow: Mark as Reviewed, Corrected, or Not a Conflict (Intentional).

8. **Medication Safety Checker (`MedicationSafetyView.jsx`):**
   - Reconciled active medications list across all prescribers.
   - **Drug-Drug Interaction Detection:** Identifies critical interactions (e.g., Lisinopril + Spironolactone hyperkalemia warning) with mechanism and monitoring advice.
   - Duplicate therapeutic class detection and allergy contraindications.

9. **Health Alerts Feed (`HealthAlertsView.jsx`):**
   - Explainable clinical alerts feed categorized by Urgent Review, Important, Needs Review, and Information.
   - Triggering evidence snippets, source document citations, and recommended clinical actions.
   - Interactive Acknowledge and Dismiss workflows.

10. **AI Health Copilot (`HealthChat.jsx`):**
    - Patient-specific RAG medical assistant.
    - **Interactive Clarification Workflow:** Prompts with clickable pills when a query is ambiguous (e.g., *"What is my sugar level?"* prompts for Fasting Glucose, Post-Meal Glucose, or HbA1c).
    - **Bracketed Source Citations:** Every claim cites `[Document Title — Date, Page 1]`.
    - **Strict Missing Evidence Guardrail:** Transparent copy and upload CTA when records lack relevant data.
    - Emergency symptom detector (chest pain, shortness of breath).

11. **Longitudinal History Timeline (`PatientHistoryTimeline.jsx`):**
    - Chronological vertical timeline across medical encounters, abnormal laboratory tests, and prescription orders.
    - Filtering by All, Documents, Labs & Vitals, and Prescriptions.

12. **Privacy, Governance & FHIR Export (`PrivacySettingsView.jsx`):**
    - **HL7® FHIR® R4 Bundle Export:** Downloads standard `careatlas-fhir-[id].json` collection with LOINC codes.
    - **Structured Tabular CSV Export:** Downloads row-level `careatlas-records-[id].csv`.
    - **Complete JSON Snapshot Export:** Full patient record snapshot.
    - AI Privacy controls: Local Deterministic (100% offline) vs Opt-In Cloud AI.
    - Live immutable Audit Log viewer.

---

## 🧪 Section 22 Verification & Demo Scenario

CareAtlas includes pre-configured synthetic fixtures for fictional patient **Eleanor Vance (P-101)** specifically designed to verify Section 22 requirements:

1. **Older Lab Report (10 Oct 2025):**
   - HbA1c: `8.6 %` [HIGH]
   - Fasting Blood Glucose: `186 mg/dL` [HIGH]
   - 2-Hour Postprandial Glucose: `254 mg/dL` [HIGH]
   - Total Cholesterol: `212 mg/dL` [HIGH]
   - Serum Creatinine: `0.92 mg/dL` [NORMAL]
   - Blood Pressure: `142/90 mmHg` [HIGH]

2. **Newer Lab Report (10 Oct 2026):**
   - HbA1c: `7.2 %` [HIGH]
   - Fasting Blood Glucose: `142 mg/dL` [HIGH]
   - 2-Hour Postprandial Glucose: `188 mg/dL` [HIGH]
   - Total Cholesterol: `188 mg/dL` [NORMAL]
   - Serum Creatinine: `0.90 mg/dL` [NORMAL]
   - Blood Pressure: `128/82 mmHg` [BORDERLINE]

3. **Percentage Points Calculation:**
   - In both `HealthTrends` and `HealthChat`, HbA1c reduction from 8.6% to 7.2% is explicitly reported as a **decrease of 1.4 percentage points** (distinguished from relative percent change).

4. **Conflicting Prescriptions:**
   - **Report 3 (Aug 2026):** Metformin 500 mg oral tablet BID, Lisinopril 10 mg daily.
   - **Report 4 (Sep 2026):** Metformin 1000 mg oral tablet BID (conflicts with 500mg) and Spironolactone 25 mg daily (interacts with Lisinopril 10mg -> risk of hyperkalemia).
   - Displayed and resolvable in **Data Conflicts** and **Medication Safety** views.

5. **Missing Thyroid Inquiry:**
   - Eleanor Vance has **zero thyroid test records** in the store.
   - Asking *"What is the patient's latest thyroid result?"* immediately returns:
     > *"I couldn't find patient-specific information about this topic in the records currently stored. This does not mean the patient does or does not have the condition. Upload a relevant report, prescription, imaging report, or doctor's note and ask again."*
   - Switching to **Marcus Chen (P-102)** reveals a normal TSH (1.85 mIU/L), confirming patient segregation.

6. **OCR Uncertainty Flag:**
   - **Report 5 (05 Oct 2026):** Scanned specialist consult note with medium extraction confidence and handwritten annotation warning in Data Validation.

---

## 🚀 Quickstart & Setup Instructions

### 1. Prerequisites
- **Node.js** v18, v20, or v22+
- **npm** v9+

### 2. Running Locally (One Command)
From the project root:
```bash
npm run dev
```
Open your browser to: **`http://localhost:5173`**

The development runner starts both the Express API (port 5000) and the React Vite client (port 5173). If MongoDB is not configured or offline, CareAtlas boots seamlessly into **In-Memory Mock Storage Mode** with full feature parity.

### 3. Running Automated Tests
Run the comprehensive 21-test suite:
```bash
npm test
```
Result:
```
✔ AIAssistant: should return transparent missing evidence message when topic has no stored records
✔ AIAssistant: should return transparent missing evidence message for thyroid inquiry when patient has no thyroid records
✔ AIAssistant: should prompt for clarification when query is ambiguous ("What is my sugar level?")
✔ AIAssistant: should report HbA1c decrease explicitly as 1.4 percentage points
✔ AIAssistant: should return urgent safety guardrail for emergency symptom terms
✔ AIAssistant: should compute chronological trends for multiple dated measurements
✔ LongitudinalEngine: calculates exactly -1.4 percentage points delta for HbA1c (8.6% -> 7.2%)
✔ LongitudinalEngine: compareTwoReports produces side-by-side rows with percentage points
✔ ConflictDetector: flags Metformin 500mg vs 1000mg dosage conflict
✔ MedicationSafety: detects Lisinopril + Spironolactone hyperkalemia risk
✔ DuplicateDetector: calculates SHA-256 and identifies identical file buffer
✔ Interoperability: generates valid HL7 FHIR R4 Bundle with LOINC codes
✔ Interoperability: exports valid CSV data with header row
✔ MockStore: provides full offline in-memory CRUD parity for clinical intelligence
✔ DateExtractor: should extract ISO format date with Report Date label
✔ DateExtractor: should prefer Report Date over DOB
✔ DateExtractor: should extract named month format like "Oct 1, 2026" or "1 October 2026"
✔ DateExtractor: should return null and confidence "none" when no date exists without substituting upload date
✔ MeasurementExtractor: should extract blood glucose, HbA1c, and BP
✔ MeasurementExtractor: should extract lipid panel, TSH, creatinine, vitamin D, and hemoglobin
✔ MeasurementExtractor: should extract vitals (heart rate, SpO2, body temperature)
✔ Auth: should return pre-configured demo credentials
✔ Auth: should successfully log in Eleanor Vance with demo credentials
✔ Auth: should reject invalid login credentials
✔ Auth: should register a new patient user and link new patient profile
✔ Patient: should create new person profile via POST /api/patients
ℹ tests 26 | pass 26 | fail 0
```

---

## 🔐 Authentication & Demo Accounts

CareAtlas features a built-in authentication system with 1-click demo logins and custom registration:

| Role / Profile | Email | Password | Linked Profile / Capabilities |
|---|---|---|---|
| **Patient 1: Eleanor Vance** | `eleanor@careatlas.health` | `patient123` | Fictional Patient `P-101` (Type 2 Diabetes, Hypertension, Active Alerts & Conflicts) |
| **Patient 2: Marcus Chen** | `marcus@careatlas.health` | `patient123` | Fictional Patient `P-102` (Annual Wellness Baseline, Normal Vitals & Thyroid) |
| **Clinician: Dr. Sarah Jenkins, MD** | `doctor@careatlas.health` | `doctor123` | Clinician Portal (Full Multi-Patient Oversight & Longitudinal Comparison) |
| **Admin: Records Administrator** | `demo@careatlas.health` | `demo123` | Administrative Access (Governance, Audit Logs & FHIR Exports) |

### 👤 Adding a New Person & Dedicated Dashboard
- Click **`+ Add Person`** in the top navigation bar at any time.
- Enter the person's name, age, biological sex, date of birth, active conditions, and optional initial medical file (PDF, DOCX, image, or text).
- Upon submission, CareAtlas creates the new profile, stores their record, **switches the active dashboard directly to that specific individual**, and surfaces their personalized timeline, trends, and AI Copilot.

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST`| `/api/auth/login` | Authenticate user with email and password |
| `POST`| `/api/auth/register` | Register new user and auto-generate linked patient profile |
| `GET` | `/api/auth/demo-credentials` | List 4 pre-configured 1-click demo accounts |
| `GET` | `/api/health` | Service health, DB mode (`MongoDB` vs `In-Memory`), AI provider status |
| `GET` | `/api/patients` | List synthetic demo patients (`Eleanor Vance`, `Marcus Chen`, etc.) |
| `POST`| `/api/patients` | Create new person / patient record |
| `GET` | `/api/patients/:id` | Get patient demographics, active conditions, care plan |
| `GET` | `/api/patients/:id/dashboard` | Aggregated dashboard: latest metrics, trends, timeline |
| `GET` | `/api/patients/:id/trends` | Longitudinal trends with window filter (`1m`, `3m`, `6m`, `1y`, `all`) |
| `GET` | `/api/patients/:id/compare-reports` | Direct side-by-side comparison between two reports |
| `GET` | `/api/patients/:id/conflicts` | List cross-report data conflicts |
| `PATCH`| `/api/patients/:id/conflicts/:conflictId` | Update conflict status (`reviewed`, `corrected`, `not_a_conflict`) |
| `GET` | `/api/patients/:id/medications` | Reconciled medications, drug interactions, duplicate therapies |
| `GET` | `/api/patients/:id/alerts` | List explainable clinical alerts |
| `PATCH`| `/api/patients/:id/alerts/:alertId` | Acknowledge or dismiss clinical alert |
| `GET` | `/api/patients/:id/summary` | Get synthesized longitudinal medical summary |
| `POST` | `/api/patients/:id/summary` | Regenerate medical summary |
| `GET` | `/api/patients/:id/missing-records` | Diagnostic gaps and missing information tasks |
| `GET` | `/api/patients/:id/history` | Unified chronological patient event history |
| `GET` | `/api/patients/:id/export/fhir` | Download HL7 FHIR R4 Bundle JSON |
| `GET` | `/api/patients/:id/export/csv` | Download structured records CSV |
| `GET` | `/api/patients/:id/export/json` | Download complete JSON snapshot |
| `GET` | `/api/reports` | List patient medical records |
| `POST` | `/api/reports` | Multipart document upload with SHA-256 duplicate detection |
| `POST` | `/api/reports/:id/correct` | Inline measurement calibration with audit logging |
| `GET` | `/api/audit-logs` | Access and modification audit trail |
| `POST` | `/api/chat` | Send question to AI Health Copilot |

---

## 📄 License
This project is licensed under the MIT License.
