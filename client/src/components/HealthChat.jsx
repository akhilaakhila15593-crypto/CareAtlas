import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  AlertTriangle,
  FileText,
  Upload,
  Calendar,
  ShieldCheck,
  Cpu,
  Info,
  HelpCircle,
} from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_SUGGESTIONS = [
  'What is the trend for my HbA1c and glucose over time?',
  "What is the patient's latest thyroid result?",
  'What is my sugar level?',
  'Are there any medication safety issues or conflicting prescriptions?',
  'What was my latest blood pressure and heart rate?',
  'Does the patient have any recorded allergies?',
];

export default function HealthChat({
  patient,
  cloudConsent,
  onToggleCloudConsent,
  onNavigateToUpload,
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: `Hello, I'm CareAtlas Copilot. I can search, synthesize, and compare medical records stored for **${patient?.name || 'this patient'}**.\n\nAsk me about vital trends, laboratory values, or medication orders. I answer strictly using evidence present in stored documents, provide document citations, and alert you if relevant records are missing.`,
      citations: [],
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || isLoading) return;

    setInput('');

    // Add user message
    const userMsg = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: q,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await api.sendChatMessage(
        patient.demoId || patient._id,
        q,
        cloudConsent
      );

      const resData = response.data;
      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: resData.answer,
        citations: resData.citations || [],
        clarificationOptions: resData.clarificationOptions || [],
        missingEvidence: resData.missingEvidence,
        isUrgent: resData.isUrgent,
        mode: resData.mode,
        suggestedTopic: resData.suggestedTopic,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Error communicating with Health Copilot:** ${err.message}. Please try again.`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#e0f2fe',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)' }}>
              CareAtlas Health Copilot
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Record Scope: <strong>{patient?.name}</strong> ({patient?.demoId})
            </div>
          </div>
        </div>

        {/* Cloud AI Toggle in Chat Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              fontWeight: 500,
              color: cloudConsent ? '#065f46' : 'var(--text-muted)',
              cursor: 'pointer',
              backgroundColor: cloudConsent ? '#ecfdf5' : '#f8fafc',
              border: `1px solid ${cloudConsent ? '#a7f3d0' : '#e2e8f0'}`,
              padding: '0.35rem 0.65rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <input
              type="checkbox"
              checked={cloudConsent}
              onChange={onToggleCloudConsent}
              style={{ cursor: 'pointer' }}
            />
            <Cpu size={14} />
            <span>Enable Cloud AI</span>
          </label>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages">
        {messages.map((m) => {
          const isUser = m.role === 'user';

          return (
            <div key={m.id} className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
              <div
                className="chat-avatar"
                style={{
                  backgroundColor: isUser ? '#0284c7' : '#0f172a',
                  color: 'white',
                }}
              >
                {isUser ? <User size={18} /> : <Bot size={18} />}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                <div
                  className="chat-bubble"
                  style={{
                    backgroundColor: m.isUrgent
                      ? '#fef2f2'
                      : m.missingEvidence
                      ? '#fffbeb'
                      : undefined,
                    border: m.isUrgent
                      ? '1px solid #fecaca'
                      : m.missingEvidence
                      ? '1px solid #fde68a'
                      : undefined,
                  }}
                >
                  {/* Urgent Alert Banner */}
                  {m.isUrgent && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 700, marginBottom: '0.5rem' }}>
                      <AlertTriangle size={18} />
                      EMERGENCY ADVISORY: IMMEDIATE MEDICAL ATTENTION RECOMMENDED
                    </div>
                  )}

                  {/* Message body text */}
                  <div
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      color: m.isUrgent ? '#991b1b' : undefined,
                      lineHeight: 1.6,
                    }}
                  >
                    {m.text}
                  </div>

                  {/* Clarification Options Pills (When question is ambiguous) */}
                  {m.clarificationOptions && m.clarificationOptions.length > 0 && (
                    <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <HelpCircle size={13} /> Select clarification:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {m.clarificationOptions.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            onClick={() => handleSend(`What is my ${opt}?`)}
                            className="btn btn-outline btn-sm"
                            style={{
                              fontSize: '0.78rem',
                              padding: '0.35rem 0.75rem',
                              backgroundColor: 'var(--bg-card)',
                              borderColor: 'var(--primary)',
                              color: 'var(--primary)',
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Evidence Call-to-action button */}
                  {m.missingEvidence && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #fde68a',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '0.75rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.4 }}>
                        Relevant record missing in stored history. Uploading original lab or doctor's note enables automated extraction.
                      </div>
                      <button
                        onClick={onNavigateToUpload}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Upload size={14} /> Upload Relevant Record
                      </button>
                    </div>
                  )}

                  {/* Source Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="citation-box">
                      <div className="citation-title">
                        Verified Evidence Citations ({m.citations.length}):
                      </div>
                      {m.citations.map((cite, cIdx) => (
                        <div key={cIdx} className="citation-item">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <FileText size={13} color="var(--primary)" />
                            <strong>[{cite.filename} — {cite.documentDate ? new Date(cite.documentDate).toISOString().split('T')[0] : 'Date unconfirmed'}, Page 1]</strong>
                            <span style={{ color: 'var(--text-muted)' }}>
                              ({cite.documentType})
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-subtle)',
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    padding: '0 0.25rem',
                  }}
                >
                  {isUser ? 'You' : `Copilot (${m.mode || 'local'})`} •{' '}
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="chat-message assistant">
            <div className="chat-avatar" style={{ backgroundColor: '#0f172a', color: 'white' }}>
              <Bot size={18} />
            </div>
            <div className="chat-bubble" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #cbd5e1',
                  borderTopColor: 'var(--primary)',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Examining patient records and synthesizing evidence...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div style={{ padding: '0.65rem 1.25rem', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
          Suggested Inquiries:
        </div>
        <div className="suggested-prompts" style={{ marginTop: 0 }}>
          {DEFAULT_SUGGESTIONS.map((s, idx) => (
            <button
              key={idx}
              className="suggested-pill"
              onClick={() => handleSend(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="chat-input-area">
        <form
          className="chat-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            className="chat-input"
            placeholder={`Ask a question about ${patient?.name || 'patient'}'s records...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
            style={{ padding: '0.75rem 1.25rem' }}
          >
            <Send size={18} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
          <Info size={12} />
          <span>
            CareAtlas answers strictly from records for {patient?.name}. Never invents clinical facts or replaces medical advice.
          </span>
        </div>
      </div>
    </div>
  );
}
