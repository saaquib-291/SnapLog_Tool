// captureUtils.js - Handles screenshot saving with proper filename format and metadata generation

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

/**
 * Generates a screenshot file path based on the required format:
 * {platform}_{section}_{sequence_number}_{timestamp}.png
 *
 * @param {Object} params - Parameters for generating the file path
 * @param {string} params.platform - The platform name (e.g., 'instagram')
 * @param {string} params.section - The section name (e.g., 'followers')
 * @param {number} params.sequenceNumber - The sequence number (zero-padded to 3 digits)
 * @param {string} params.timestamp - Timestamp in ISO 8601 basic format (YYYYMMDDTHHMMSS)
 * @param {string} params.baseDir - Base directory where screenshots should be saved
 * @returns {string} Full file path for the screenshot
 */
function generateScreenshotPath({ platform, section, sequenceNumber, timestamp, baseDir }) {
  // Ensure sequenceNumber is zero-padded to 3 digits
  const seqStr = String(sequenceNumber).padStart(3, '0');
  // Format: {platform}_{section}_{seq}_{timestamp}.png
  const filename = `${platform}_${section}_${seqStr}_${timestamp}.png`;
  // Return the full path
  return path.join(baseDir, filename);
}

/**
 * Computes the SHA-256 hash of a buffer
 * @param {Buffer} buffer - The buffer to hash
 * @returns {Promise<string>} Hexadecimal SHA-256 hash
 */
async function computeHash(buffer) {
  const hash = crypto.createHash('sha256');
  hash.update(buffer);
  return hash.digest('hex');
}

/**
 * Generates a metadata object that conforms to the shared metadata schema
 * @param {Object} params - Parameters for generating metadata
 * @param {string} params.caseId - The case ID
 * @param {string} params.examinerId - The examiner ID
 * @param {string} params.platform - The platform name
 * @param {string} params.section - The section name
 * @param {number} params.sequenceNumber - The sequence number
 * @param {string} params.timestamp - Timestamp in ISO 8601 basic format (YYYYMMDDTHHMMSS)
 * @param {string} params.filePath - The full file path of the screenshot
 * @param {string} params.sourceUrlOrScreen - The source URL or screen description
 * @returns {Promise<Object>} Metadata object
 */
async function generateMetadata({ caseId, examinerId, platform, section, sequenceNumber, timestamp, filePath, sourceUrlOrScreen }) {
  // In a real implementation, we would read the file buffer and compute its hash
  // For now, we'll assume the file has been saved and we can read it
  // However, to avoid reading the file twice (once for saving, once for hashing),
  // we might want to pass the buffer to this function or compute hash before saving.
  // Let's adjust: we'll compute the hash when we have the buffer and pass it in.
  // But for the function signature, we'll keep it as is and note that the file must exist.

  // Read the file to compute hash
  const fileBuffer = await fs.readFile(filePath);
  const sha256Hash = await computeHash(fileBuffer);

  // Generate valid ISO 8601 timestamp
  const isoTimestamp = new Date().toISOString();
  // Include section and a random string to prevent SQLite ID collisions
  const cleanId = `SCR-${(platform || 'EV').slice(0, 2).toUpperCase()}-${(section || 'X').replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}-${String(sequenceNumber || 1).padStart(3, '0')}-${crypto.randomBytes(3).toString('hex')}`;
  return {
    screenshot_id: cleanId,
    case_id: caseId,
    examiner_id: examinerId,
    platform: platform,
    os: 'windows', // Since this is the Windows app
    section: section,
    sequence_number: sequenceNumber,
    timestamp: isoTimestamp,
    sha256_hash: sha256Hash,
    file_path: filePath,
    source_url_or_screen: sourceUrlOrScreen
  };
}

/**
 * Saves a screenshot buffer to a file and returns the file path and metadata
 * @param {Object} params - Parameters for saving screenshot
 * @param {Buffer} params.buffer - The screenshot buffer (e.g., from page.screenshot())
 * @param {string} params.platform - The platform name
 * @param {string} params.section - The section name
 * @param {number} params.sequenceNumber - The sequence number
 * @param {string} params.timestamp - Timestamp in ISO 8601 basic format (YYYYMMDDTHHMMSS)
 * @param {string} params.baseDir - Base directory where screenshots should be saved
 * @param {string} params.caseId - The case ID
 * @param {string} params.examinerId - The examiner ID
 * @param {string} params.sourceUrlOrScreen - The source URL or screen description
 * @returns {Promise<Object>} Object containing { filePath, metadata }
 */
async function saveScreenshot(params) {
  const { buffer, platform, section, sequenceNumber, timestamp, baseDir, caseId, examinerId, sourceUrlOrScreen } = params;

  // Generate the file path
  const filePath = generateScreenshotPath({
    platform,
    section,
    sequenceNumber,
    timestamp,
    baseDir
  });

  // Ensure the directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // Save the buffer to the file
  await fs.writeFile(filePath, buffer);

  // Generate metadata
  const metadata = await generateMetadata({
    caseId,
    examinerId,
    platform,
    section,
    sequenceNumber,
    timestamp,
    filePath,
    sourceUrlOrScreen
  });

  return { filePath, metadata };
}

module.exports = {
  generateScreenshotPath,
  computeHash,
  generateMetadata,
  saveScreenshot
};