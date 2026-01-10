import { spawn } from 'node:child_process';
import { platform } from 'node:os';

const useShell = platform() === 'win32';
const vite = spawn('pnpm', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
  stdio: 'inherit',
  shell: useShell,
});

const electron = spawn(
  'pnpm',
  ['electron', '.', '--enable-logging'],
  {
    stdio: 'inherit',
    shell: useShell,
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: 'http://localhost:5173',
    },
  }
);

const shutdown = (signal) => {
  if (!vite.killed) {
    vite.kill(signal);
  }
  if (!electron.killed) {
    electron.kill(signal);
  }
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

vite.on('close', (code) => {
  if (code && code !== 0) {
    shutdown('SIGTERM');
  }
});

electron.on('close', (code) => {
  if (code && code !== 0) {
    shutdown('SIGTERM');
  }
});
