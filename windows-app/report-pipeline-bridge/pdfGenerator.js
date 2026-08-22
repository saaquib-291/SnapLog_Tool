// pdfGenerator.js - Native Electron Panchnama & Section 65B PDF Report Generator
const { shell } = require('electron');
const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const sqlite = require('../electron/db/sqlite');

/**
 * Generate official Panchnama & Section 65B Evidence PDF by invoking the Python pipeline
 * @param {string} caseId - The Case ID
 * @param {Object} options - Report customization options
 * @returns {Promise<Object>} Result with filePath
 */
async function generatePanchnamaPdf(caseId, options = {}) {
  return new Promise(async (resolve) => {
    try {
      // 1. Prepare output directory and file path
      const reportsDir = path.join(__dirname, '..', 'data', 'reports');
      await fs.mkdir(reportsDir, { recursive: true });

      const fileName = `Panchnama_${caseId}_${Date.now()}.pdf`;
      const outputPath = path.join(reportsDir, fileName);

      // 2. Resolve paths for Python script and DB
      const pythonScriptPath = path.join(__dirname, '..', '..', 'report-pipeline', 'report_generator.py');
      const dbPath = sqlite.dbPath;
      const dataDir = path.join(__dirname, '..', '..', 'data', 'captures'); // base dir for images if needed

      console.log(`[REPORT] Spawning Python report pipeline...`);
      console.log(`[REPORT] Script: ${pythonScriptPath}`);
      console.log(`[REPORT] DB: ${dbPath}`);
      
      // Assuming `python` is available in the system PATH. 
      // For production, this could point to a bundled PyInstaller executable.
      const pythonProcess = spawn('python', [
        pythonScriptPath,
        '--db', dbPath,
        '--case-id', caseId,
        '--output', outputPath,
        '--case-dir', path.join(__dirname, '..', '..') // base dir
      ]);

      pythonProcess.stdout.on('data', (data) => {
        console.log(`[REPORT-PIPELINE]: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        console.error(`[REPORT-PIPELINE ERROR]: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`[REPORT] Generated Panchnama PDF: ${outputPath}`);
          // Auto-open PDF file on Windows desktop
          shell.openPath(outputPath);

          resolve({
            success: true,
            filePath: outputPath,
            fileName: fileName,
            message: `Panchnama PDF successfully generated and opened: ${fileName}`
          });
        } else {
          console.error(`[REPORT] Python pipeline failed with code ${code}`);
          resolve({
            success: false,
            error: `Report pipeline failed with exit code ${code}`
          });
        }
      });
    } catch (error) {
      console.error('[REPORT] Failed to generate PDF:', error);
      resolve({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = {
  generatePanchnamaPdf
};
