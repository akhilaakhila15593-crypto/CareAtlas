/**
 * CareAtlas Evidence-Based AI Health Copilot Engine
 *
 * Implements RAG document retrieval, clickable citations, ambiguous query clarification,
 * missing-data guardrails, percentage point calculations, and emergency symptom alerts.
 */

const OpenAI = require('openai');
const config = require('../config');

const MISSING_EVIDENCE_TEMPLATE =
  "I could not find sufficient information about this topic in the currently uploaded medical records. " +
  "This does not mean the patient does or does not have the condition. " +
  "Upload a relevant report, prescription, imaging report, or doctor's note and ask again.";

const URGENT_SYMPTOM_TERMS = [
  'chest pain',
  'shortness of breath',
  'difficulty breathing',
  'stroke',
  'facial drooping',
  'slurred speech',
  'coughing blood',
  'severe bleeding',
  'anaphylaxis',
  'passed out',
  'loss of consciousness',
  'sudden severe headache',
  'blue lips',
];

const HEALTH_TOPICS = [
  {
    topic: 'thyroid',
    terms: ['thyroid', 'tsh', 't3', 't4', 'hypothyroid', 'hyperthyroid', 'levothyroxine'],
    metricKeys: ['tsh'],
    missingExplanation: 'Specifically, no thyroid function tests (TSH, T3, or T4) were identified in the stored records.',
  },
  {
    topic: 'kidney',
    terms: ['kidney', 'renal', 'creatinine', 'egfr', 'bun', 'nephro'],
    metricKeys: ['creatinine'],
    missingExplanation: 'Specifically, no renal function panel or serum creatinine test was identified.',
  },
  {
    topic: 'liver',
    terms: ['liver', 'hepatic', 'alt', 'ast', 'bilirubin', 'alkaline phosphatase'],
    metricKeys: [],
    missingExplanation: 'Specifically, no hepatic function panel (ALT, AST, Bilirubin) was identified in the stored records.',
  },
  {
    topic: 'diabetes',
    terms: ['diabetes', 'diabetic', 'blood sugar', 'glucose', 'a1c', 'hba1c', 'glycemic'],
    metricKeys: ['glucose', 'glucose_postprandial', 'hba1c'],
    missingExplanation: 'No glycemic testing or diabetes consultation notes were found.',
  },
  {
    topic: 'blood pressure',
    terms: ['blood pressure', 'hypertension', 'systolic', 'diastolic', 'bp'],
    metricKeys: ['bp_systolic', 'bp_diastolic'],
    missingExplanation: 'No blood pressure vital recordings were found in the stored documents.',
  },
  {
    topic: 'cholesterol / heart',
    terms: ['cholesterol', 'lipid', 'ldl', 'hdl', 'triglyceride', 'cardio', 'heart'],
    metricKeys: ['cholesterol_total', 'ldl', 'hdl', 'heart_rate'],
    missingExplanation: 'No lipid panel or cardiovascular consultation notes were found in the records.',
  },
  {
    topic: 'anemia / hemoglobin',
    terms: ['anemia', 'hemoglobin', 'hgb', 'iron', 'ferritin', 'rbc', 'hematocrit'],
    metricKeys: ['hemoglobin'],
    missingExplanation: 'No complete blood count (CBC) or hemoglobin measurement was found in the stored records.',
  },
  {
    topic: 'vitamin d',
    terms: ['vitamin d', 'vit d', 'cholecalciferol', '25-hydroxy'],
    metricKeys: ['vitamin_d'],
    missingExplanation: 'No 25-hydroxy Vitamin D assay was identified in the stored records.',
  },
  {
    topic: 'asthma / respiratory',
    terms: ['asthma', 'wheezing', 'inhaler', 'copd', 'bronchitis'],
    metricKeys: [],
    missingExplanation: 'No pulmonary function tests, spirometry, or asthma documentation was found.',
  },
  {
    topic: 'allergy',
    terms: ['allergy', 'allergies', 'allergic', 'rash', 'hives', 'histamine'],
    metricKeys: [],
    missingExplanation: 'No allergy panel or documented hypersensitivity reactions were found.',
  },
  {
    topic: 'medications',
    terms: ['medication', 'medications', 'medicine', 'prescribed', 'prescription', 'drug', 'dose', 'dosage', 'pills'],
    metricKeys: [],
    missingExplanation: 'No official prescription records or active medication orders were found.',
  },
];

/**
 * Word-boundary safe term matching to prevent substring false-positives.
 */
function matchesTerm(text, term) {
  if (!text || !term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escaped}\\b`, 'i');
  return regex.test(text);
}

/**
 * Checks for urgent medical emergency symptoms.
 */
function checkUrgentSymptoms(question) {
  for (const symptom of URGENT_SYMPTOM_TERMS) {
    if (matchesTerm(question, symptom)) {
      return {
        isUrgent: true,
        symptom,
        warning:
          `🚨 CRITICAL MEDICAL SAFETY ALERT: You mentioned "${symptom}". ` +
          `CareAtlas is an informational record organizer and CANNOT assess medical emergencies. ` +
          `If you or the patient are experiencing acute, severe, or worsening symptoms, ` +
          `please immediately call emergency services (such as 911 or your local emergency number) ` +
          `or go to the nearest emergency department.`,
      };
    }
  }
  return { isUrgent: false };
}

/**
 * Formats a clickable citation string: [Title — Date, Page 1]
 */
function formatCitation(title, date, page = 1) {
  const dStr = date ? new Date(date).toLocaleDateString() : 'Date unconfirmed';
  return `[${title} — ${dStr}, Page ${page}]`;
}

/**
 * Checks for ambiguous patient questions that benefit from clarification.
 */
function checkAmbiguousQuery(question, reports) {
  const lower = question.toLowerCase();

  // "What is my sugar level?" or "what is my blood sugar?"
  const isGenericSugarQuery =
    (lower.includes('sugar') || lower.includes('glucose')) &&
    !lower.includes('fasting') &&
    !lower.includes('post-meal') &&
    !lower.includes('postprandial') &&
    !lower.includes('a1c') &&
    !lower.includes('hba1c');

  if (isGenericSugarQuery) {
    const availableTypes = [];
    const hasFasting = reports.some((r) => (r.measurements || []).some((m) => m.key === 'glucose'));
    const hasPostprandial = reports.some((r) => (r.measurements || []).some((m) => m.key === 'glucose_postprandial'));
    const hasA1c = reports.some((r) => (r.measurements || []).some((m) => m.key === 'hba1c'));

    if (hasFasting) availableTypes.push('Fasting Blood Glucose');
    if (hasPostprandial) availableTypes.push('Two-Hour Post-Meal Glucose');
    if (hasA1c) availableTypes.push('Hemoglobin A1c (HbA1c)');

    if (availableTypes.length > 1) {
      return {
        isAmbiguous: true,
        answer:
          `Your medical records contain multiple blood sugar / glycemic measurements:\n\n` +
          availableTypes.map((t) => `• **${t}**`).join('\n') +
          `\n\nWhich specific measurement would you like to review? Click one below or ask directly:`,
        clarificationOptions: availableTypes,
      };
    }
  }

  return { isAmbiguous: false };
}

/**
 * Deterministic local record search and question answerer.
 */
function answerWithLocalEngine(patient, reports, question) {
  const lowerQ = question.toLowerCase();
  const citations = [];

  // 1. Clarification check
  const ambiguous = checkAmbiguousQuery(question, reports);
  if (ambiguous.isAmbiguous) {
    return {
      answer: ambiguous.answer,
      citations: [],
      clarificationOptions: ambiguous.clarificationOptions,
      missingEvidence: false,
      mode: 'deterministic-clarification',
    };
  }

  // 2. Recognized Topic Query Check
  const queriedTopic = HEALTH_TOPICS.find((ht) =>
    ht.terms.some((term) => matchesTerm(lowerQ, term))
  );

  let hasRelevantEvidence = false;
  let relevantReports = [];

  if (queriedTopic) {
    relevantReports = reports.filter((r) => {
      const textMatch = queriedTopic.terms.some((term) =>
        matchesTerm(r.extractedText, term) ||
        matchesTerm(r.originalFilename, term) ||
        matchesTerm(r.summary, term)
      );
      const metricMatch = (r.measurements || []).some((m) =>
        queriedTopic.metricKeys.includes(m.key)
      );
      return textMatch || metricMatch;
    });

    if (relevantReports.length > 0) {
      hasRelevantEvidence = true;
    } else {
      // Missing data rule: recognized topic with zero supporting records
      const missingExplanation = queriedTopic.missingExplanation || '';
      return {
        answer: `${MISSING_EVIDENCE_TEMPLATE}\n\n*${missingExplanation}*`,
        citations: [],
        missingEvidence: true,
        suggestedTopic: queriedTopic.topic,
        mode: 'deterministic-guardrail',
      };
    }
  } else {
    // Generic keyword search
    const keywords = lowerQ
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !['what', 'when', 'which', 'where', 'how', 'show', 'tell', 'patient', 'does', 'have', 'been', 'with'].includes(w));

    relevantReports = reports.filter((r) => {
      const txt = (r.extractedText || '').toLowerCase();
      return keywords.some((kw) => txt.includes(kw));
    });

    hasRelevantEvidence = relevantReports.length > 0;
  }

  if (!hasRelevantEvidence && reports.length === 0) {
    return {
      answer: "No medical documents have been uploaded for this patient yet. Please upload records to enable health record search.",
      citations: [],
      missingEvidence: true,
      mode: 'deterministic-local',
    };
  }

  if (!hasRelevantEvidence) {
    return {
      answer: MISSING_EVIDENCE_TEMPLATE,
      citations: [],
      missingEvidence: true,
      mode: 'deterministic-local',
    };
  }

  // 3. Medication Query
  const isMedicationQuery = ['medicine', 'medication', 'dose', 'prescrib', 'rx', 'drug'].some((w) => lowerQ.includes(w));
  if (isMedicationQuery) {
    const rxReports = reports.filter(
      (r) =>
        r.documentType === 'Prescription' ||
        (r.linkedMedications && r.linkedMedications.length > 0) ||
        (r.extractedText || '').toLowerCase().includes('prescription')
    );

    if (rxReports.length === 0) {
      return {
        answer:
          "I could not find reliable prescription records or medication dosages for this patient in the stored documents. " +
          "Specific medication names and dosages cannot be inferred without clear documentary evidence. " +
          "Please upload an official pharmacy label or doctor's prescription.",
        citations: [],
        missingEvidence: true,
        mode: 'deterministic-local',
      };
    }

    let rxSummary = `Based on stored records for ${patient.name}, the following medication orders were identified:\n\n`;
    rxReports.forEach((rx) => {
      const dStr = rx.documentDate ? new Date(rx.documentDate).toLocaleDateString() : 'Date unconfirmed';
      const citeBadge = formatCitation(rx.originalFilename, rx.documentDate, 1);
      rxSummary += `📄 **${rx.originalFilename}** (Date: ${dStr}) ${citeBadge}:\n`;

      if (rx.linkedMedications && rx.linkedMedications.length > 0) {
        rx.linkedMedications.forEach((m) => {
          rxSummary += `  • **${m.name}**: ${m.strength || ''} ${m.dosage || ''} — Directions: ${m.frequency || 'Daily'}\n`;
        });
        rxSummary += '\n';
      } else {
        const lines = (rx.extractedText || '').split('\n').filter((l) => /(?:mg|tablet|capsule|daily|twice|bid|take)/i.test(l));
        rxSummary += lines.slice(0, 6).map((l) => `  • ${l.trim()}`).join('\n') + '\n\n';
      }

      citations.push({
        documentId: rx._id,
        filename: rx.originalFilename,
        documentDate: rx.documentDate,
        documentType: rx.documentType,
        pageNumber: 1,
        citationText: citeBadge,
        snippet: rx.extractedText ? rx.extractedText.substring(0, 180) : '',
      });
    });

    rxSummary += "⚠️ *Important Notice: Always verify dosages directly with your pharmacy label and treating clinician. Do not modify medication regimens without professional medical supervision.*";
    return {
      answer: rxSummary,
      citations,
      missingEvidence: false,
      mode: 'deterministic-local',
    };
  }

  // 4. Trend / Comparison Query
  const isTrendQuery = ['trend', 'change', 'over time', 'history', 'compare', 'difference', 'previous', 'latest', 'between'].some((w) => lowerQ.includes(w));
  if (isTrendQuery) {
    const targetTopic = queriedTopic || HEALTH_TOPICS.find((ht) => ht.metricKeys.length > 0 && ht.terms.some((t) => lowerQ.includes(t)));
    const targetKeys = targetTopic ? targetTopic.metricKeys : ['glucose', 'glucose_postprandial', 'hba1c', 'bp_systolic', 'ldl'];

    const gatheredMeasurements = [];
    reports.forEach((r) => {
      (r.measurements || []).forEach((m) => {
        if (targetKeys.includes(m.key)) {
          gatheredMeasurements.push({
            ...m,
            docName: r.originalFilename,
            docDate: m.date || r.documentDate,
            reportId: r._id,
          });
        }
      });
    });

    if (gatheredMeasurements.length > 0) {
      gatheredMeasurements.sort((a, b) => {
        const dA = a.docDate ? new Date(a.docDate).getTime() : 0;
        const dB = b.docDate ? new Date(b.docDate).getTime() : 0;
        return dA - dB;
      });

      const byKey = {};
      gatheredMeasurements.forEach((m) => {
        if (!byKey[m.key]) byKey[m.key] = [];
        byKey[m.key].push(m);
      });

      let trendText = `### Chronological Measurement History for ${patient.name}\n\n`;

      Object.entries(byKey).forEach(([key, list]) => {
        const label = list[0].label || key;
        const unit = list[0].unit || '';
        trendText += `#### ${label} (${unit}):\n`;
        list.forEach((obs) => {
          const dStr = obs.docDate ? new Date(obs.docDate).toLocaleDateString() : 'Unknown date';
          const citeBadge = formatCitation(obs.docName, obs.docDate, 1);
          trendText += `• **${dStr}**: ${obs.rawValue} *(Source: ${obs.docName})* ${citeBadge}\n`;
        });

        if (list.length >= 2) {
          const first = list[0];
          const last = list[list.length - 1];
          if (first.numericValue !== null && last.numericValue !== null) {
            const delta = Number((last.numericValue - first.numericValue).toFixed(2));
            const deltaSign = delta > 0 ? `+${delta}` : `${delta}`;

            if (unit === '%') {
              // Percentage points distinction
              const relPct = Number((((last.numericValue - first.numericValue) / first.numericValue) * 100).toFixed(1));
              trendText += `*Observation:* Change from ${first.numericValue}% to ${last.numericValue}% represents a difference of **${deltaSign} percentage points** (relative change: ${relPct}%).\n\n`;
            } else {
              trendText += `*Observation:* Numerical difference between first recorded (${first.numericValue}) and latest (${last.numericValue}) is **${deltaSign} ${unit}**.\n\n`;
            }
          }
        } else {
          trendText += `*Note:* Only 1 dated observation found for this metric in stored records.\n\n`;
        }
      });

      trendText += `> **Clinical Context Notice:** Described strictly as chronological numeric changes. Physiological and clinical interpretation requires your treating physician.`;

      relevantReports.forEach((r) => {
        citations.push({
          documentId: r._id,
          filename: r.originalFilename,
          documentDate: r.documentDate,
          documentType: r.documentType,
          pageNumber: 1,
          citationText: formatCitation(r.originalFilename, r.documentDate, 1),
          snippet: r.summary || (r.extractedText || '').substring(0, 160),
        });
      });

      return {
        answer: trendText,
        citations,
        missingEvidence: false,
        mode: 'deterministic-local',
      };
    }
  }

  // 5. General Evidence Synthesis
  let summaryText = `### Document Evidence for ${patient.name}\n\n`;
  summaryText += `Found **${relevantReports.length}** relevant record(s) matching your query:\n\n`;

  relevantReports.forEach((rep) => {
    const dStr = rep.documentDate ? new Date(rep.documentDate).toLocaleDateString() : 'Date unconfirmed';
    const citeBadge = formatCitation(rep.originalFilename, rep.documentDate, 1);
    summaryText += `📄 **${rep.originalFilename}** (${rep.documentType} — Dated: ${dStr}) ${citeBadge}\n`;
    if (rep.summary) {
      summaryText += `*Summary:* ${rep.summary}\n`;
    }

    if (rep.measurements && rep.measurements.length > 0) {
      const topM = rep.measurements.slice(0, 6).map((m) => `${m.label}: **${m.rawValue}**`).join(', ');
      summaryText += `*Extracted Values:* ${topM}\n`;
    }

    const snippet = (rep.extractedText || '').substring(0, 200).replace(/\n+/g, ' ');
    summaryText += `*Excerpt:* "${snippet}..."\n\n`;

    citations.push({
      documentId: rep._id,
      filename: rep.originalFilename,
      documentDate: rep.documentDate,
      documentType: rep.documentType,
      pageNumber: 1,
      citationText: citeBadge,
      snippet,
    });
  });

  summaryText += `*Extraction Accuracy Note: Please verify all figures and values against the original source documents.*`;

  return {
    answer: summaryText,
    citations,
    missingEvidence: false,
    mode: 'deterministic-local',
  };
}

/**
 * Main AI Assistant Entry Point
 */
async function processHealthQuery({ patient, reports, question, cloudConsent = false }) {
  if (!patient) throw new Error('Patient record is required.');
  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    throw new Error('Question cannot be empty.');
  }

  // 1. Critical Emergency Check
  const urgentCheck = checkUrgentSymptoms(question);
  if (urgentCheck.isUrgent) {
    return {
      answer: urgentCheck.warning,
      citations: [],
      isUrgent: true,
      mode: 'safety-guardrail',
    };
  }

  // 2. Ambiguity Clarification Check
  const ambiguous = checkAmbiguousQuery(question, reports);
  if (ambiguous.isAmbiguous) {
    return {
      answer: ambiguous.answer,
      citations: [],
      clarificationOptions: ambiguous.clarificationOptions,
      missingEvidence: false,
      mode: 'deterministic-clarification',
    };
  }

  // 3. Recognized topic missing-data check BEFORE any model call
  const lowerQ = question.toLowerCase();
  const queriedTopic = HEALTH_TOPICS.find((ht) =>
    ht.terms.some((term) => matchesTerm(lowerQ, term))
  );

  if (queriedTopic) {
    const hasEvidence = reports.some((r) => {
      const textMatch = queriedTopic.terms.some((term) =>
        matchesTerm(r.extractedText, term) ||
        matchesTerm(r.originalFilename, term) ||
        matchesTerm(r.summary, term)
      );
      const metricMatch = (r.measurements || []).some((m) =>
        queriedTopic.metricKeys.includes(m.key)
      );
      return textMatch || metricMatch;
    });

    if (!hasEvidence) {
      const missingExplanation = queriedTopic.missingExplanation || '';
      return {
        answer: `${MISSING_EVIDENCE_TEMPLATE}\n\n*${missingExplanation}*`,
        citations: [],
        missingEvidence: true,
        suggestedTopic: queriedTopic.topic,
        mode: 'deterministic-guardrail',
      };
    }
  }

  // 4. Optional Cloud AI (OpenAI Responses / Chat API)
  const canUseCloudAi =
    Boolean(config.enableCloudAi) &&
    Boolean(config.openaiApiKey) &&
    Boolean(cloudConsent);

  if (canUseCloudAi) {
    try {
      console.log('🤖 Invoking OpenAI Cloud AI Copilot with user consent...');
      const openai = new OpenAI({ apiKey: config.openaiApiKey });

      const recordsContext = reports.map((r, idx) => {
        const dStr = r.documentDate ? new Date(r.documentDate).toISOString().split('T')[0] : 'Unknown Date';
        const measurementsStr = (r.measurements || [])
          .map((m) => `${m.label}: ${m.rawValue} (Ref: ${m.referenceRange || 'N/A'}, Flag: ${m.abnormalFlag || 'NORMAL'})`)
          .join(', ');

        return `DOCUMENT ${idx + 1}:
ID: ${r._id}
Title: ${r.originalFilename}
Type: ${r.documentType}
Date: ${dStr}
Measurements: ${measurementsStr || 'None extracted'}
Text:
${(r.extractedText || '').substring(0, 2000)}
---`;
      }).join('\n\n');

      const systemPrompt = `You are CareAtlas Copilot, an evidence-grounded clinical health assistant.
Assisting for synthetic patient "${patient.name}" (Age: ${patient.age}, Sex: ${patient.sex}).

STRICT EVIDENCE BOUNDARY RULES:
1. ONLY answer using facts present in the provided DOCUMENT excerpts below.
2. If evidence is NOT present, state clearly: "${MISSING_EVIDENCE_TEMPLATE}"
3. NEVER invent or extrapolate diagnoses, medications, dosages, or lab numbers.
4. For trends, report actual dates and numeric values. For percentage metrics (like HbA1c), describe changes in "percentage points" (e.g. from 8.6% to 7.2% is a 1.4 percentage point decrease).
5. Always cite supporting documents formatted as: [Document Title — Date, Page 1].
6. Explain clinical terms simply, without providing unverified medical treatment advice.`;

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `PATIENT RECORDS CONTEXT:\n${recordsContext}\n\nUSER QUESTION:\n${question}`,
          },
        ],
        temperature: 0.1,
        max_tokens: 800,
      });

      const cloudAnswer = response.choices[0]?.message?.content || '';

      const citations = reports.slice(0, 3).map((r) => ({
        documentId: r._id,
        filename: r.originalFilename,
        documentDate: r.documentDate,
        documentType: r.documentType,
        pageNumber: 1,
        citationText: formatCitation(r.originalFilename, r.documentDate, 1),
        snippet: (r.extractedText || '').substring(0, 150),
      }));

      return {
        answer: cloudAnswer,
        citations,
        missingEvidence: false,
        mode: 'cloud-openai',
      };
    } catch (cloudErr) {
      console.warn(`⚠️ Cloud AI call failed (${cloudErr.message}). Gracefully falling back to deterministic local search.`);
      const localResult = answerWithLocalEngine(patient, reports, question);
      localResult.fallbackNotice = 'Cloud AI was unavailable; answered using local deterministic engine.';
      return localResult;
    }
  }

  // 5. Default: Deterministic local search engine
  return answerWithLocalEngine(patient, reports, question);
}

module.exports = {
  processHealthQuery,
  answerWithLocalEngine,
  checkUrgentSymptoms,
  checkAmbiguousQuery,
  formatCitation,
  MISSING_EVIDENCE_TEMPLATE,
  HEALTH_TOPICS,
};
