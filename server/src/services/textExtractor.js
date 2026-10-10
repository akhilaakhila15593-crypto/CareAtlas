const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Tesseract = require('tesseract.js');

/**
 * Extracts raw textual content from supported file types.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - MIME type of file
 * @param {string} originalFilename - Original filename for extension hints
 * @returns {Promise<{ text: string, extractor: string, isScannedPdf?: boolean, warning?: string }>}
 */
async function extractText(buffer, mimeType, originalFilename = '') {
  const ext = (originalFilename.split('.').pop() || '').toLowerCase();

  // 1. Plain Text or CSV
  if (mimeType === 'text/plain' || mimeType === 'text/csv' || ext === 'txt' || ext === 'csv') {
    const text = buffer.toString('utf-8').trim();
    return {
      text,
      extractor: 'plain-text',
      warning: text.length === 0 ? 'Document appears empty.' : null,
    };
  }

  // 2. Microsoft Word (DOCX)
  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = (result.value || '').trim();
      return {
        text,
        extractor: 'mammoth-docx',
        warning: text.length === 0 ? 'No readable text found inside DOCX.' : null,
      };
    } catch (err) {
      throw new Error(`Failed to extract text from DOCX file: ${err.message}`);
    }
  }

  // 3. PDF (Text-based PDF)
  if (mimeType === 'application/pdf' || ext === 'pdf') {
    try {
      const pdfData = await pdfParse(buffer);
      const text = (pdfData.text || '').trim();

      // Check for scanned / raster-only PDFs where text layer is virtually non-existent
      if (!text || text.length < 20) {
        return {
          text: '',
          extractor: 'pdf-parse',
          isScannedPdf: true,
          warning:
            'This PDF appears to be a scanned or image-only document without a selectable text layer. ' +
            'CareAtlas currently processes selectable-text digital PDFs. ' +
            'Actionable tip: Please upload the native electronic PDF from your patient portal, or convert the page to PNG/JPG image format to run optical character recognition (OCR).',
        };
      }

      return {
        text,
        extractor: 'pdf-parse',
        pageCount: pdfData.numpages,
      };
    } catch (err) {
      throw new Error(`PDF parsing failed: ${err.message}`);
    }
  }

  // 4. Image Formats (OCR via Tesseract.js)
  const isImage =
    mimeType.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'tif'].includes(ext);

  if (isImage) {
    try {
      console.log(`🔍 Running Tesseract OCR on image (${originalFilename || mimeType})...`);
      const {
        data: { text, confidence },
      } = await Tesseract.recognize(buffer, 'eng', {
        logger: () => {}, // silent progress logger
      });

      const cleanedText = (text || '').trim();
      return {
        text: cleanedText,
        extractor: 'tesseract-ocr',
        ocrConfidence: confidence,
        warning:
          cleanedText.length < 10
            ? 'OCR extracted minimal text. Please ensure image is well-lit and oriented upright.'
            : null,
      };
    } catch (err) {
      throw new Error(`OCR processing failed on image file: ${err.message}`);
    }
  }

  throw new Error(`Unsupported file type: ${mimeType || ext}. Supported types: PDF, DOCX, TXT, CSV, PNG, JPG, WEBP, BMP, TIFF.`);
}

module.exports = {
  extractText,
};
