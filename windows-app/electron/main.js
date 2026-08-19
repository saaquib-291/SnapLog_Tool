// Main Electron process file
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');
const authHandlers = require('./ipc-handlers/authHandlers');
const caseHandlers = require('./ipc-handlers/caseHandlers');
const captureHandlers = require('./ipc-handlers/captureHandlers');
const { generatePanchnamaPdf } = require('../report-pipeline-bridge/pdfGenerator');
const sqlite = require('./db/sqlite');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
  console.log('[MAIN] Creating browser window...');
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'Social Media Forensic Tool',
    show: true,
    center: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, '..', 'build', 'index.html');
  console.log('[MAIN] Loading file:', indexPath);
  mainWindow.loadFile(indexPath);

  mainWindow.once('ready-to-show', () => {
    console.log('[MAIN] Window ready to show');
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('[MAIN] WebContents did-finish-load');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[MAIN] did-fail-load:', errorCode, errorDescription);
  });

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Handle window closing
  mainWindow.on('closed', () => {
    console.log('[MAIN] Window closed');
    mainWindow = null;
  });
}

// Register IPC handlers
function registerIPCHandlers() {
  // Auth handlers
  ipcMain.handle('auth:login', authHandlers.handleLogin);
  ipcMain.handle('auth:logout', authHandlers.handleLogout);
  ipcMain.handle('auth:getCurrentUser', authHandlers.handleGetCurrentUser);

  // Case handlers (backed by SQLite forensic.db)
  ipcMain.handle('cases:getAll', caseHandlers.handleGetAll);
  ipcMain.handle('cases:getById', caseHandlers.handleGetById);
  ipcMain.handle('cases:add', caseHandlers.handleAdd);
  ipcMain.handle('cases:delete', caseHandlers.handleDelete);

  // Capture handlers
  ipcMain.handle('capture:start', captureHandlers.handleStart);
  ipcMain.handle('capture:getStatus', captureHandlers.handleGetStatus);
  ipcMain.handle('capture:stop', captureHandlers.handleStop);

  // Report & Panchnama PDF handlers
  ipcMain.handle('reports:generatePdf', async (event, { caseId, options }) => {
    return await generatePanchnamaPdf(caseId, options);
  });
}

// Create window when Electron is ready
app.whenReady().then(async () => {
  // Initialize SQLite database and tables (forensic.db)
  await sqlite.initDatabase();

  createWindow();
  registerIPCHandlers();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked and no other windows are open
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});