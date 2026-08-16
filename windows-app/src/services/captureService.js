// Capture service - connects to Electron IPC layer

export const captureService = {
  // Start a capture for a given case and platform
  startCapture: async (caseId, platform) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.startCapture(caseId, platform);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to start capture');
      }
    }

    // Fallback for development/testing when not in Electron
    // Simulate network delay and processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In a real app, this would send a request to the main process to start the capture
    // For now, we'll just log it and return a mock result
    console.log(`Starting capture for case ${caseId} on platform ${platform}`);

    // Simulate potential error (for demonstration)
    // if (platform === 'unsupported') {
    //   throw new Error('Platform not supported');
    // }

    return {
      success: true,
      caseId,
      platform,
      startedAt: new Date().toISOString(),
      message: `Capture started for ${platform} in case ${caseId}`
    };
  },

  // Get capture status (could be used for progress updates)
  getCaptureStatus: async (caseId, platform) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.getCaptureStatus(caseId, platform);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to get capture status');
      }
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    // Return a mock status
    return {
      caseId,
      platform,
      status: 'in_progress', // or 'completed', 'failed'
      progress: Math.floor(Math.random() * 100), // random progress for demo
      screenshotsCaptured: Math.floor(Math.random() * 50),
      totalExpected: 100
    };
  },

  // Stop a capture
  stopCapture: async (caseId, platform) => {
    if (window.electronAPI) {
      const result = await window.electronAPI.stopCapture(caseId, platform);
      if (result.success) {
        return result;
      } else {
        throw new Error(result.error || 'Failed to stop capture');
      }
    }

    // Fallback
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log(`Stopping capture for case ${caseId} on platform ${platform}`);
    return { success: true };
  },

  // Subscribe to capture progress updates
  onProgress: (callback) => {
    if (window.electronAPI) {
      window.electronAPI.onCaptureProgress(callback);
    }
    // No fallback needed for development - in real app this would be wired up
  },

  // Subscribe to capture completion events
  onCompleted: (callback) => {
    if (window.electronAPI) {
      window.electronAPI.onCaptureCompleted(callback);
    }
  },

  // Subscribe to capture error events
  onError: (callback) => {
    if (window.electronAPI) {
      window.electronAPI.onCaptureError(callback);
    }
  }
};

export default captureService;