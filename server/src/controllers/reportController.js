const fs = require('fs');
const path = require('path');
const mockStore = require('../database/mockStore');
const Report = require('../models/Report');
const Patient = require('../models/Patient');
const AuditLog = require('../models/AuditLog');
const { extractText } = require('../services/textExtractor');
const { extractDocumentDate } = require('../services/dateExtractor');
const { extractMeasurements, extractMedicationsAndConditions } = require('../services/measurementExtractor');
const { calculateChecksum, checkDuplicate } = require('../services/duplicateDetector');
const { validateReport } = require('../services/validationEngine');

/**
 * GET /api/reports
 */
async function getReports(req, res, next) {
  try {
    const { patientId, documentType } = req.query;

    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId query parameter is required' });
    }

    if (mockStore.isMockMode()) {
      const reports = await mockStore.getReports({ patientId, documentType });
      return res.json({ success: true, count: reports.length, data: reports });
    }

    const filter = { patientId };
    if (documentType && documentType !== 'All') {
      filter.documentType = documentType;
    }

    // Exclude raw file fields if any from listing
    const reports = await Report.find(filter)
      .select('-fileBuffer')
      .sort({ documentDate: -1, createdAt: -1 })
      .lean();

    return res.json({ success: true, count: reports.length, data: reports });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/:id
 */
async function getReportById(req, res, next) {
  try {
    const { id } = req.params;
    let report = null;

    if (mockStore.isMockMode()) {
      report = await mockStore.getReportById(id);
    } else {
      report = await Report.findById(id).lean();
    }

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    return res.json({ success: true, data: report });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/reports
 * Uploads, computes checksum, detects duplicates, parses text, extracts document date,
 * captures clinical measurements, medications, conditions, validates, and persists.
 */
async function uploadReport(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No document file provided for upload.' });
    }

    const { patientId, documentType: manualDocType } = req.body;
    if (!patientId) {
      return res.status(400).json({ success: false, error: 'patientId is required in form body.' });
    }

    const file = req.file;
    console.log(`📥 Received file upload: "${file.originalname}" (${file.mimetype}, ${(file.size / 1024).toFixed(1)} KB)`);

    // 1. Checksum calculation and duplicate detection
    const checksum = calculateChecksum(file.buffer);
    let existingReports = [];
    if (mockStore.isMockMode()) {
      existingReports = await mockStore.getReports({ patientId });
    } else {
      existingReports = await Report.find({ patientId }).lean();
    }

    const duplicateCheck = checkDuplicate(checksum, existingReports);

    // 2. Text extraction
    const extractionResult = await extractText(file.buffer, file.mimetype, file.originalname);
    const extractedText = extractionResult.text || '';

    // Check if scanned PDF with no text layer
    if (extractionResult.isScannedPdf) {
      return res.status(422).json({
        success: false,
        error: 'Scanned Image-Only PDF Detected',
        message: extractionResult.warning,
      });
    }

    // 3. Document Date extraction
    const dateResult = extractDocumentDate(extractedText);
    const docDate = dateResult.normalizedDate ? new Date(dateResult.normalizedDate) : null;

    // 4. Document Type Detection (if not specified or set to auto)
    let docType = manualDocType;
    if (!docType || docType === 'Auto-detect' || docType === 'Other') {
      const lower = (extractedText + ' ' + file.originalname).toLowerCase();
      if (lower.includes('prescription') || lower.includes('rx ') || lower.includes('sig:') || lower.includes('refill')) {
        docType = 'Prescription';
      } else if (lower.includes('lab') || lower.includes('panel') || lower.includes('pathology') || lower.includes('specimen') || lower.includes('hba1c') || lower.includes('glucose')) {
        docType = 'Lab Report';
      } else if (lower.includes('clinic') || lower.includes('visit') || lower.includes('encounter') || lower.includes('assessment') || lower.includes('physical exam')) {
        docType = 'Clinic Visit Note';
      } else if (lower.includes('radiology') || lower.includes('x-ray') || lower.includes('mri') || lower.includes('ct scan') || lower.includes('ultrasound')) {
        docType = 'Radiology / Imaging';
      } else if (lower.includes('discharge') || lower.includes('hospital course')) {
        docType = 'Discharge Summary';
      } else {
        docType = 'Other';
      }
    }

    // 5. Clinical Measurement Extraction
    const tempReportId = `rep-tmp-${Date.now()}`;
    const measurements = extractMeasurements(extractedText, docDate, tempReportId);

    // 6. Medications & Conditions extraction
    const { medications: linkedMedications, conditions: linkedConditions } = extractMedicationsAndConditions(extractedText);

    // 7. Fetch Patient for demographic validation
    let patient = null;
    if (mockStore.isMockMode()) {
      patient = await mockStore.getPatientById(patientId);
    } else {
      patient = await Patient.findOne({ $or: [{ demoId: patientId }, { _id: patientId }] }).lean();
    }

    // 8. Validation Engine Check
    const tentativeReport = {
      originalFilename: file.originalname,
      extractedText,
      documentDate: docDate,
      extractionConfidence: dateResult.confidence,
      measurements,
      linkedMedications,
      linkedConditions,
    };
    const validationResult = validateReport(tentativeReport, patient);

    // If duplicate was detected, adjust validation status
    let finalValidationStatus = validationResult.validationStatus;
    if (duplicateCheck.isDuplicate) {
      finalValidationStatus = 'Duplicate candidate';
      validationResult.validationDetails.unshift({
        rule: 'Duplicate Document Detection',
        status: 'Duplicate candidate',
        message: duplicateCheck.message,
        severity: 'High',
      });
    }

    // 9. Short summary creation
    let summary = '';
    if (measurements.length > 0) {
      summary = `Captured ${measurements.length} vital/lab measurement(s): ${measurements.slice(0, 4).map((m) => m.label).join(', ')}.`;
    } else if (linkedMedications.length > 0) {
      summary = `Captured ${linkedMedications.length} medication order(s): ${linkedMedications.slice(0, 3).map((m) => m.name).join(', ')}.`;
    } else if (extractedText.length > 0) {
      summary = `Document text parsed (${extractedText.length} characters). No standardized vitals detected.`;
    } else {
      summary = 'Empty document text extracted.';
    }

    // 10. Save file to disk
    const uploadFilename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(path.resolve(__dirname, '../../uploads'), uploadFilename);
    await fs.promises.writeFile(filePath, file.buffer);

    // 11. Persist to MongoDB or MockStore
    const reportData = {
      patientId,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      documentType: docType,
      filePath: uploadFilename,
      fileSize: file.size,
      checksum,
      extractedText,
      documentDate: docDate,
      rawDateEvidence: dateResult.rawDateEvidence,
      extractionConfidence: dateResult.confidence,
      dateExtractionMessage: dateResult.message,
      measurements,
      linkedMedications,
      linkedConditions,
      validationStatus: finalValidationStatus,
      verificationStatus: duplicateCheck.isDuplicate ? 'needs_review' : 'unverified',
      validationDetails: validationResult.validationDetails,
      summary,
      source: 'upload',
      isSynthetic: true,
      auditTrail: [
        {
          action: 'DOCUMENT_UPLOAD',
          editor: 'User',
          timestamp: new Date(),
          reason: 'Initial file upload and clinical text extraction',
        },
      ],
    };

    let savedReport = null;
    if (mockStore.isMockMode()) {
      savedReport = await mockStore.createReport(reportData);
      await mockStore.logAuditAction({
        patientId,
        action: 'DOCUMENT_UPLOAD',
        performedBy: 'User Action',
        targetId: savedReport._id,
        details: { filename: file.originalname, checksum, measurementsCount: measurements.length },
      });
    } else {
      const doc = new Report(reportData);
      savedReport = await doc.save();
      const auditLog = new AuditLog({
        patientId,
        action: 'DOCUMENT_UPLOAD',
        performedBy: 'User Action',
        targetId: savedReport._id,
        details: { filename: file.originalname, checksum, measurementsCount: measurements.length },
      });
      await auditLog.save();
    }

    return res.status(201).json({
      success: true,
      message: 'Medical document uploaded and processed successfully.',
      data: savedReport,
      isDuplicate: duplicateCheck.isDuplicate,
      duplicateWarning: duplicateCheck.isDuplicate ? duplicateCheck.message : null,
      extractionWarnings: extractionResult.warning || null,
      verificationPrompt: 'Please verify the detected date and extracted measurements against your original document.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/reports/:id/file
 * Downloads or views original file.
 */
async function getReportFile(req, res, next) {
  try {
    const { id } = req.params;
    let report = null;

    if (mockStore.isMockMode()) {
      report = await mockStore.getReportById(id);
    } else {
      report = await Report.findById(id).lean();
    }

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Check if uploaded file exists on disk
    if (report.filePath) {
      const diskPath = path.resolve(__dirname, '../../uploads', report.filePath);
      if (fs.existsSync(diskPath)) {
        res.setHeader('Content-Type', report.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${report.originalFilename}"`);
        return fs.createReadStream(diskPath).pipe(res);
      }
    }

    // If file is synthetic or mock text, stream text representation
    if (report.extractedText) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${report.originalFilename}"`);
      return res.send(report.extractedText);
    }

    return res.status(404).json({ success: false, error: 'Original document content not found on server.' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/reports/:id
 */
async function deleteReport(req, res, next) {
  try {
    const { id } = req.params;
    let deleted = null;

    if (mockStore.isMockMode()) {
      deleted = await mockStore.deleteReport(id);
      if (deleted) {
        await mockStore.logAuditAction({
          patientId: deleted.patientId,
          action: 'DOCUMENT_DELETE',
          performedBy: 'User Action',
          targetId: id,
          details: { filename: deleted.originalFilename },
        });
      }
    } else {
      deleted = await Report.findByIdAndDelete(id).lean();
      if (deleted) {
        const auditLog = new AuditLog({
          patientId: deleted.patientId,
          action: 'DOCUMENT_DELETE',
          performedBy: 'User Action',
          targetId: id,
          details: { filename: deleted.originalFilename },
        });
        await auditLog.save();
      }
    }

    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    // Remove file from disk if present
    if (deleted.filePath) {
      const diskPath = path.resolve(__dirname, '../../uploads', deleted.filePath);
      if (fs.existsSync(diskPath)) {
        fs.unlink(diskPath, () => {});
      }
    }

    return res.json({
      success: true,
      message: 'Medical report deleted successfully.',
      data: { id },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getReports,
  getReportById,
  uploadReport,
  getReportFile,
  deleteReport,
};
