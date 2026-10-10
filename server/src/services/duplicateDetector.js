const crypto = require('crypto');

/**
 * Calculates SHA-256 checksum for a file buffer and checks for duplicate documents.
 */
function calculateChecksum(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid file buffer required to calculate checksum');
  }
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Checks if a document with the same checksum exists for this patient.
 *
 * @param {string} checksum
 * @param {Array} existingReports
 * @returns {{ isDuplicate: boolean, existingReport: object | null }}
 */
function checkDuplicate(checksum, existingReports = []) {
  if (!checksum || !Array.isArray(existingReports)) {
    return { isDuplicate: false, existingReport: null };
  }

  const match = existingReports.find((r) => r.checksum === checksum);
  if (match) {
    return {
      isDuplicate: true,
      existingReport: match,
      message: `Duplicate document detected. Identical file already stored as "${match.originalFilename}" (Report ID: ${match._id}).`,
    };
  }

  return { isDuplicate: false, existingReport: null };
}

module.exports = {
  calculateChecksum,
  checkDuplicate,
};
