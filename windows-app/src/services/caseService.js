// Case service - connects to Electron IPC layer

export const caseService = {
  // Get all cases
  getCases: async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getCases();
      if (result.success) {
        return result.cases;
      } else {
        throw new Error(result.error || 'Failed to get cases');
      }
    }

    // Fallback for development/testing when not in Electron
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock data
    return [
      {
        id: 'CASE2026-001',
        title: 'Sample Investigation Case',
        description: 'A sample case for demonstration purposes',
        examinerId: 'examiner001',
        createdAt: '2026-08-15T10:30:00Z',
        platforms: [] // Platforms that have been captured
      },
      {
        id: 'CASE2026-002',
        title: 'Cyberbullying Investigation',
        description: 'Investigation into online harassment',
        examinerId: 'examiner001',
        createdAt: '2026-08-10T14:15:00Z',
        platforms: ['instagram', 'facebook'] // Some platforms already captured
      }
    ];
  },

  // Get case by ID
  getCaseById: async (id) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getCaseById(id);
      if (result.success) {
        return result.case;
      } else {
        throw new Error(result.error || `Failed to get case with ID ${id}`);
      }
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 300));

    // Find the case in our mock data
    const allCases = await caseService.getCases();
    const caseItem = allCases.find(caseItem => caseItem.id === id);

    if (!caseItem) {
      throw new Error(`Case with ID ${id} not found`);
    }

    return caseItem;
  },

  // Add a new case
  addCase: async (caseData) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.addCase(caseData);
      if (result.success) {
        return result.case;
      } else {
        throw new Error(result.error || 'Failed to add case');
      }
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 500));

    // In a real app, this would send data to the backend
    // For now, we'll just log it
    console.log('Adding new case:', caseData);
    return {
      id: `CASE2026-${Date.now().toString().slice(-4)}`,
      ...caseData,
      createdAt: new Date().toISOString(),
      platforms: []
    };
  }
};

export default caseService;