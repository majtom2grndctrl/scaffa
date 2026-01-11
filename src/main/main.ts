import { app, BrowserWindow } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { registerAllIpcHandlers } from './ipc/index.js';
import { workspaceManager } from './workspace/workspace-manager.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const shouldDisableHardwareAcceleration =
  process.env.SCAFFA_DISABLE_GPU === '1' ||
  (process.env.VITE_DEV_SERVER_URL &&
    process.env.SCAFFA_DISABLE_GPU !== '0');

if (shouldDisableHardwareAcceleration) {
  // Avoid noisy EGL driver errors on some Linux setups during dev.
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('disable-gpu-compositing');
}

const createMainWindow = () => {
  const window = new BrowserWindow({
    width: 1400,
    height: 900,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void window.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void window.loadFile(join(__dirname, '../../dist/renderer/index.html'));
  }
};

const launchExtensionHost = () => {
  // Placeholder: spawn a dedicated extension host process here.
};

app.whenReady().then(async () => {
  // Load persisted workspace state
  await workspaceManager.load();

  // Register all IPC handlers before creating windows
  registerAllIpcHandlers();

  createMainWindow();
  launchExtensionHost();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
