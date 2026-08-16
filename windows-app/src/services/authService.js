// Auth service - connects to Electron IPC layer
// In development, we check if electronAPI is available (when running in Electron)
// In production/build, it will be available
// For testing purposes, we might want to mock this differently

export const authService = {
  // Login function - calls Electron IPC
  login: async (username, password) => {
    // Check if we're in Electron environment
    if (window.electronAPI) {
      return window.electronAPI.login({ username, password });
    }

    // Fallback for development/testing when not in Electron
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo purposes, accept any non-empty credentials
    if (username && password) {
      return {
        id: 'examiner001',
        username: username,
        email: `${username.toLowerCase()}@forensic.tool`,
        role: 'Forensic Examiner',
        department: 'Digital Forensics',
        joinedAt: '2026-01-15T08:00:00Z'
      };
    }

    throw new Error('Invalid credentials');
  },

  // Logout function
  logout: async () => {
    if (window.electronAPI) {
      return window.electronAPI.logout();
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 300));
    return true;
  },

  // Get current user
  getCurrentUser: async () => {
    if (window.electronAPI) {
      return window.electronAPI.getCurrentUser();
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      id: 'examiner001',
      username: 'examiner001',
      email: 'examiner001@forensic.tool',
      role: 'Forensic Examiner',
      department: 'Digital Forensics',
      joinedAt: '2026-01-15T08:00:00Z'
    };
  }
};

export default authService;