// Preload script for Electron
// This runs in a sandboxed context before the web page loads
// It exposes safe APIs to the renderer process via the `window.electronAPI` object

const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'electronAPI',
  {
    // Auth
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getCurrentUser: () => ipcRenderer.invoke('auth:getCurrentUser'),

    // Cases
    getCases: () => ipcRenderer.invoke('cases:getAll'),
    getCaseById: (id) => ipcRenderer.invoke('cases:getById', id),
    addCase: (caseData) => ipcRenderer.invoke('cases:add', caseData),
    deleteCase: (id) => ipcRenderer.invoke('cases:delete', id),

    // Capture
    startCapture: (caseId, platform, credentials) => ipcRenderer.invoke('capture:start', { caseId, platform, credentials }),
    getCaptureStatus: (caseId, platform) => ipcRenderer.invoke('capture:getStatus', { caseId, platform }),
    stopCapture: (caseId, platform) => ipcRenderer.invoke('capture:stop', { caseId, platform }),
    // Real-time progress & live logs
    onCaptureProgress: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('capture:progress', listener);
      return () => ipcRenderer.removeListener('capture:progress', listener);
    },
    onCaptureLog: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('capture:log', listener);
      return () => ipcRenderer.removeListener('capture:log', listener);
    },
    onCaptureBrowserClosed: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('capture:browserClosed', listener);
      return () => ipcRenderer.removeListener('capture:browserClosed', listener);
    },
    onCaptureCompleted: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('capture:completed', listener);
      return () => ipcRenderer.removeListener('capture:completed', listener);
    },
    onCaptureError: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('capture:error', listener);
      return () => ipcRenderer.removeListener('capture:error', listener);
    },

    // Reports & Panchnama PDF Generation
    generatePanchnamaPdf: (caseId, options) => ipcRenderer.invoke('reports:generatePdf', { caseId, options })
  }
);