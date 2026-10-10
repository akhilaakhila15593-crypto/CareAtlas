import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Calendar,
  Activity,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Filter,
  Search,
} from 'lucide-react';
import { api } from '../services/api';

const DOC_TYPES = [
  'All',
  'Lab Report',
  'Prescription',
  'Clinic Visit Note',
  'Radiology / Imaging',
  'Discharge Summary',
  'Other',
];

export default function MedicalRecords({
  patientId,
  patientName,
  reports = [],
  loading,
  onRefresh,
  onNavigateToDashboard,
  onOpenNewPatient,
}) {
  const [selectedType, setSelectedType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDocType, setUploadDocType] = useState('Auto-detect');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [expandedTextIds, setExpandedTextIds] = useState(new Set());
  const [copiedId, setCopiedId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const handleFileUpload = async (file) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('patientId', patientId);
    if (uploadDocType !== 'Auto-detect') {
      formData.append('documentType', uploadDocType);
    }

    try {
      const response = await api.uploadReport(formData);
      setUploadSuccess({
        message: 'Document successfully processed!',
        filename: file.name,
        verificationPrompt: response.verificationPrompt,
        warning: response.extractionWarnings,
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onRefresh();
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await api.deleteReport(id);
        onRefresh();
      } catch (err) {
        alert(`Failed to delete record: ${err.message}`);
      }
    }
  };

  const toggleExpand = (id) => {
    const next = new Set(expandedTextIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedTextIds(next);
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter reports
  const filteredReports = reports.filter((r) => {
    const matchesType = selectedType === 'All' || r.documentType === selectedType;
    const matchesSearch =
      searchQuery.trim() === '' ||
      r.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.extractedText || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.measurements || []).some((m) =>
        m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.rawValue.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesType && matchesSearch;
  });

  return (
    <div>
      {/* Upload Box */}
      <div className="card" style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <h3 className="card-title" style={{ margin: 0 }}>
            <UploadCloud size={20} color="var(--primary)" />
            Upload Medical Records & Documents
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Target Patient:
            </span>
            <span
              style={{
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                borderRadius: 'var(--radius-sm)',
                padding: '0.2rem 0.6rem',
                fontSize: '0.82rem',
                fontWeight: 700,
              }}
            >
              {patientName ? `${patientName} (${patientId})` : patientId}
            </span>
            {onOpenNewPatient && (
              <button
                type="button"
                onClick={onOpenNewPatient}
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                title="Add and switch to a different person"
              >
                + New Person
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Document Classification:
          </label>
          <select
            value={uploadDocType}
            onChange={(e) => setUploadDocType(e.target.value)}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'white',
              fontSize: '0.85rem',
            }}
          >
            <option value="Auto-detect">Auto-detect from document text</option>
            <option value="Lab Report">Lab Report</option>
            <option value="Prescription">Doctor Prescription</option>
            <option value="Clinic Visit Note">Clinic Visit Note</option>
            <option value="Radiology / Imaging">Radiology / Imaging</option>
            <option value="Discharge Summary">Discharge Summary</option>
            <option value="Other">Other Document</option>
          </select>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>
            (Max file size: 15MB)
          </span>
        </div>

        {/* Drag and drop zone */}
        <div
          className={`dropzone ${isDragging ? 'dragover' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt,.csv,.png,.jpg,.jpeg,.webp,.bmp,.tiff,.tif"
          />

          <UploadCloud className="dropzone-icon" />
          <h4 style={{ fontWeight: 700, color: 'var(--secondary)' }}>
            {isUploading ? 'Extracting Text, Dates & Measurements...' : 'Drop medical reports here or click to browse'}
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Supported formats: Selectable-text PDFs, Word DOCX, TXT, CSV, and image files (PNG, JPG, WEBP, TIFF) with OCR
          </p>

          <div className="format-pills">
            {['PDF (Selectable)', 'DOCX', 'TXT', 'CSV', 'PNG', 'JPEG', 'WEBP', 'TIFF (OCR)'].map((f) => (
              <span key={f} className="format-pill">{f}</span>
            ))}
          </div>
        </div>

        {/* Upload Success Banner */}
        {uploadSuccess && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <CheckCircle2 size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#065f46', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <strong>{uploadSuccess.message}</strong> ({uploadSuccess.filename})
                </div>
                {onNavigateToDashboard && (
                  <button
                    type="button"
                    onClick={onNavigateToDashboard}
                    className="btn btn-primary btn-sm"
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      backgroundColor: '#059669',
                      borderColor: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                    }}
                  >
                    View in Dashboard →
                  </button>
                )}
              </div>
              <div style={{ marginTop: '0.25rem', color: '#047857' }}>
                {uploadSuccess.verificationPrompt}
              </div>
              {uploadSuccess.warning && (
                <div style={{ marginTop: '0.25rem', color: '#b45309' }}>
                  ⚠️ {uploadSuccess.warning}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Error Banner */}
        {uploadError && (
          <div
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: '#991b1b' }}>
              <strong>Upload Failed:</strong> {uploadError}
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '4px' }}>
          {DOC_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="btn btn-sm"
              style={{
                backgroundColor: selectedType === type ? 'var(--primary)' : 'white',
                color: selectedType === type ? 'white' : 'var(--text-main)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '240px' }}>
          <Search
            size={16}
            color="#94a3b8"
            style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search in records or vitals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem 0.45rem 2rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              outline: 'none',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Records List */}
      {filteredReports.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 0.75rem' }} />
          <h4 style={{ fontWeight: 600, color: 'var(--text-muted)' }}>No medical records match your criteria</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', marginTop: '0.25rem' }}>
            Upload documents using the area above or adjust your search filter.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredReports.map((report) => {
            const isExpanded = expandedTextIds.has(report._id);
            const isCopied = copiedId === report._id;

            return (
              <div key={report._id} className="card">
                {/* Header */}
                <div className="card-header" style={{ alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#e0f2fe',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={22} />
                    </div>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>
                        {report.originalFilename}
                      </h4>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                        <span className="badge" style={{ backgroundColor: '#f1f5f9', color: '#334155' }}>
                          {report.documentType}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Size: {(report.fileSize / 1024).toFixed(1)} KB
                        </span>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Source: {report.source === 'upload' ? 'User Upload' : 'Synthetic Fixture'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <a
                      href={api.getFileUrl(report._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      title="View original document file"
                    >
                      <ExternalLink size={14} /> View Original
                    </a>
                    <button
                      onClick={() => handleDelete(report._id, report.originalFilename)}
                      className="btn btn-danger btn-sm"
                      title="Delete this record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Date Extraction Banner */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Calendar size={16} color="var(--primary)" />
                    <span>
                      Normalized Document Date:{' '}
                      <strong style={{ color: 'var(--secondary)' }}>
                        {report.documentDate
                          ? new Date(report.documentDate).toISOString().split('T')[0]
                          : 'No date detected'}
                      </strong>
                    </span>
                    {report.rawDateEvidence && (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        (Evidence: <em>"{report.rawDateEvidence}"</em>)
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {report.validationStatus && (
                      <span
                        className="badge"
                        style={{
                          backgroundColor:
                            report.validationStatus === 'Validated'
                              ? '#dcfce7'
                              : report.validationStatus === 'Potential conflict'
                              ? '#fef3c7'
                              : '#fee2e2',
                          color:
                            report.validationStatus === 'Validated'
                              ? '#166534'
                              : report.validationStatus === 'Potential conflict'
                              ? '#854d0e'
                              : '#991b1b',
                        }}
                      >
                        {report.validationStatus}
                      </span>
                    )}
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          report.extractionConfidence === 'high'
                            ? '#dcfce7'
                            : report.extractionConfidence === 'medium'
                            ? '#fef3c7'
                            : '#f1f5f9',
                        color:
                          report.extractionConfidence === 'high'
                            ? '#166534'
                            : report.extractionConfidence === 'medium'
                            ? '#854d0e'
                            : '#64748b',
                      }}
                    >
                      Confidence: {report.extractionConfidence}
                    </span>
                    {report.checksum && (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-subtle)', fontFamily: 'var(--font-mono)' }} title={`SHA-256: ${report.checksum}`}>
                        SHA: {report.checksum.substring(0, 8)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Structured Measurements Detected */}
                {report.measurements && report.measurements.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Activity size={14} color="var(--primary)" />
                      EXTRACTED MEASUREMENTS ({report.measurements.length}):
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {report.measurements.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: 'var(--radius-sm)',
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.8rem',
                            color: '#166534',
                          }}
                        >
                          <strong>{m.label}:</strong> {m.rawValue}
                          {m.referenceRange && (
                            <span style={{ color: '#15803d', marginLeft: '0.35rem', fontSize: '0.75rem' }}>
                              (Ref: {m.referenceRange})
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Notice */}
                <div
                  style={{
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.45rem 0.75rem',
                    fontSize: '0.78rem',
                    color: '#92400e',
                    marginBottom: '0.85rem',
                  }}
                >
                  ⚠️ <strong>Verification Notice:</strong> Automated OCR and regex parsing may contain inaccuracies. Please verify these numbers against the original document before taking action.
                </div>

                {/* Expandable Extracted Text Accordion */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      onClick={() => toggleExpand(report._id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--primary)',
                      }}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isExpanded ? 'Hide Extracted Text' : 'View Extracted Text'}
                      <span style={{ color: 'var(--text-subtle)', fontWeight: 400 }}>
                        ({(report.extractedText || '').length} characters)
                      </span>
                    </button>

                    {isExpanded && (
                      <button
                        onClick={() => handleCopyText(report._id, report.extractedText)}
                        className="btn btn-outline btn-sm"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        {isCopied ? <Check size={12} color="#059669" /> : <Copy size={12} />}
                        {isCopied ? 'Copied' : 'Copy Text'}
                      </button>
                    )}
                  </div>

                  {isExpanded && (
                    <pre
                      style={{
                        marginTop: '0.75rem',
                        padding: '1rem',
                        backgroundColor: '#f8fafc',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        maxHeight: '320px',
                        overflowY: 'auto',
                      }}
                    >
                      {report.extractedText || 'No text extracted from this document.'}
                    </pre>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
