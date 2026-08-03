'use strict';

const path = require('node:path');
const { app, BrowserWindow, ipcMain, shell } = require('electron');
const { CaptureEngine } = require('../integrations/overwolf/capture-engine');
const { createProvider } = require('../integrations/overwolf/provider');

let mainWindow = null;
let provider = null;
let captureEngine = null;

function sendToRenderer(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send(channel, payload);
}

function publishCaptureState(state = captureEngine.getPublicState()) {
  sendToRenderer('overwolf:capture-state', state);
  return state;
}

function bindProviderEvents() {
  provider.on('status', status => sendToRenderer('overwolf:status', status));
  provider.on('system', (name, details) => publishCaptureState(captureEngine.ingestSystem(name, details)));
  provider.on('info', (gameId, payload) => publishCaptureState(captureEngine.ingestInfo(gameId, payload)));
  provider.on('event', (gameId, payload) => publishCaptureState(captureEngine.ingestGameEvent(gameId, payload)));
}

function registerIpc() {
  ipcMain.handle('overwolf:get-status', () => provider.getStatus());
  ipcMain.handle('overwolf:get-capture-state', () => captureEngine.getPublicState());
  ipcMain.handle('overwolf:get-diagnostics', (_event, limit) => captureEngine.getDiagnostics(limit));
  ipcMain.handle('overwolf:run-mock-scenario', async () => {
    if (typeof provider.runScenario !== 'function') return { started: false, reason: 'not-mock-provider' };
    const started = await provider.runScenario();
    return { started };
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#10131a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '..', 'index.html'));
  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

app.whenReady().then(async () => {
  const mock = process.argv.includes('--mock-overwolf');
  captureEngine = new CaptureEngine({
    storagePath: path.join(app.getPath('userData'), 'overwolf-capture-v1.json')
  });
  provider = createProvider({ electronApp: app, mock });

  bindProviderEvents();
  registerIpc();
  createWindow();
  await provider.start();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
