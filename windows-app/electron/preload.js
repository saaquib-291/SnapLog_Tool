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

    // Capture
    startCapture: (caseId, platform) => ipcRenderer.invoke('capture:start', { caseId, platform }),
    getCaptureStatus: (caseId, platform) => ipcRenderer.invoke('capture:getStatus', { caseId, platform }),
    stopCapture: (caseId, platform) => ipcRenderer.invoke('capture:stop', { caseId, platform }),
    // Real-time progress updates
    onCaptureProgress: (callback) => ipcRenderer.on('capture:progress', callback),
    onCaptureCompleted: (callback) => ipcRenderer.on('capture:completed', callback),
    onCaptureError: (callback) => ipcRenderer.on('capture:error', callback),

    // Reports & Panchnama PDF Generation
    generatePanchnamaPdf: (caseId, options) => ipcRenderer.invoke('reports:generatePdf', { caseId, options })
  }
);