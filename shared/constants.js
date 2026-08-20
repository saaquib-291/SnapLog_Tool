/**
 * shared/constants.js
 * 
 * JavaScript constants module for the SnapLog Windows (Electron) app.
 * Loads the canonical definitions from the shared JSON files and exports
 * typed accessors so the Windows app never hardcodes platform or section values.
 * 
 * Usage:
 *   const { PLATFORMS, SECTIONS, getPlatformById } = require('../../shared/constants');
 */

const path = require('path');

// Load canonical JSON definitions
const constantsData = require('./constants.json');
const sectionData = require('./section_enum.json');
const metadataSchema = require('./metadata_schema.json');

// ── Platform Constants ──────────────────────────────────────────────────────

/** @type {Array<{id: string, displayName: string, supportedSections: string[]}>} */
const PLATFORMS = constantsData.platforms;

/** @type {string[]} All platform IDs (e.g. ['instagram', 'facebook', ...]) */
const PLATFORM_IDS = PLATFORMS.map(p => p.id);

// ── Section Constants ───────────────────────────────────────────────────────

/** @type {string[]} All valid section names */
const SECTIONS = sectionData.sections;

/** @type {Object<string, string>} Section ID → display name mapping */
const SECTION_DISPLAY_NAMES = sectionData.section_display_names;

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Look up a platform definition by its ID.
 * @param {string} id - Platform ID (e.g. 'instagram')
 * @returns {Object|undefined} Platform object or undefined if not found
 */
function getPlatformById(id) {
  return PLATFORMS.find(p => p.id === id);
}

/**
 * Check if a section name is valid (exists in the canonical enum).
 * @param {string} section - Section name to validate
 * @returns {boolean}
 */
function isValidSection(section) {
  return SECTIONS.includes(section);
}

/**
 * Check if a platform ID is valid.
 * @param {string} platformId - Platform ID to validate
 * @returns {boolean}
 */
function isValidPlatform(platformId) {
  return PLATFORM_IDS.includes(platformId);
}

/**
 * Get the supported sections for a given platform.
 * @param {string} platformId - Platform ID
 * @returns {string[]} List of supported section names, or empty array if platform not found
 */
function getSupportedSections(platformId) {
  const platform = getPlatformById(platformId);
  return platform ? platform.supportedSections : [];
}

/**
 * Get the human-readable display name for a section.
 * @param {string} section - Section ID (e.g. 'account_info')
 * @returns {string} Display name (e.g. 'Account Information / Profile')
 */
function getSectionDisplayName(section) {
  return SECTION_DISPLAY_NAMES[section] || section;
}

// ── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Data
  PLATFORMS,
  PLATFORM_IDS,
  SECTIONS,
  SECTION_DISPLAY_NAMES,
  METADATA_SCHEMA: metadataSchema,

  // Helpers
  getPlatformById,
  isValidSection,
  isValidPlatform,
  getSupportedSections,
  getSectionDisplayName
};
