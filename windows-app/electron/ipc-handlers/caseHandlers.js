// Case IPC handlers backed by SQLite (forensic.db)
const sqlite = require('../db/sqlite');

/**
 * Handle get all cases request
 */
async function handleGetAll(event) {
  try {
    const cases = sqlite.getAllCases();
    return { success: true, cases };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle get case by ID request
 * @param {Event} event - IPC event
 * @param {string} id - Case ID
 */
async function handleGetById(event, id) {
  try {
    const caseItem = sqlite.getCaseById(id);
    if (caseItem) {
      return { success: true, case: caseItem };
    } else {
      return { success: false, error: `Case with ID ${id} not found` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle add case request
 * @param {Event} event - IPC event
 * @param {Object} caseData - Case data to add
 */
async function handleAdd(event, caseData) {
  try {
    const newCase = sqlite.addCase(caseData);
    return { success: true, case: newCase };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Handle delete case request
 * @param {Event} event - IPC event
 * @param {string} id - Case ID to delete
 */
async function handleDelete(event, id) {
  try {
    const deleted = sqlite.deleteCase(id);
    if (deleted) {
      return { success: true, message: `Case ${id} deleted successfully` };
    } else {
      return { success: false, error: `Failed to delete case ${id}` };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  handleGetAll,
  handleGetById,
  handleAdd,
  handleDelete
};