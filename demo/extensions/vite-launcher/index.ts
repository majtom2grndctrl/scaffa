// ─────────────────────────────────────────────────────────────────────────────
// Vite+React Launcher (v0) - Preview Launcher for Vite Dev Server
// ─────────────────────────────────────────────────────────────────────────────
// Launches and manages the Vite dev server for the demo app.

import { spawn, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import type {
  ExtensionContext,
  PreviewLauncher,
  Disposable,
} from '../../../src/extension-host/extension-context.js';
import type {
  PreviewLauncherOptions,
  PreviewLaunchResult,
  PreviewLogEntry,
} from '../../../src/shared/preview-session.js';

// ─────────────────────────────────────────────────────────────────────────────
// Vite Launcher Implementation
// ─────────────────────────────────────────────────────────────────────────────

class ViteLauncher implements PreviewLauncher {
  readonly descriptor = {
    id: 'vite-react',
    displayName: 'Vite + React',
    description: 'Launch Vite dev server for React applications',
    supportedSessionTypes: ['app' as const],
  };

  private process: ChildProcess | null = null;
  private logListeners: Array<(entry: PreviewLogEntry) => void> = [];
  private appPath: string;

  constructor(workspaceRoot: string | null) {
    // Resolve demo/app path relative to workspace root
    this.appPath = workspaceRoot
      ? join(workspaceRoot, 'app')
      : join(process.cwd(), 'demo', 'app');
  }

  async start(options: PreviewLauncherOptions): Promise<PreviewLaunchResult> {
    if (this.process) {
      throw new Error('Launcher already running');
    }

    console.log('[ViteLauncher] Starting Vite dev server at:', this.appPath);

    // Spawn pnpm dev:local in demo/app directory
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Vite dev server start timeout (30s)'));
      }, 30000);

      try {
        this.process = spawn('pnpm', ['dev:local'], {
          cwd: this.appPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          env: {
            ...process.env,
            FORCE_COLOR: '0', // Disable color codes for easier parsing
          },
        });

        let urlResolved = false;

        // Listen for URL in stdout
        this.process.stdout?.on('data', (data: Buffer) => {
          const output = data.toString();
          this.emitLog('info', output);

          // Look for Vite's "Local: http://..." line
          const urlMatch = output.match(/Local:\s+(https?:\/\/[^\s]+)/i);
          if (urlMatch && !urlResolved) {
            urlResolved = true;
            clearTimeout(timeout);

            const url = urlMatch[1].trim();
            console.log('[ViteLauncher] Vite dev server ready at:', url);

            resolve({
              url,
              pid: this.process?.pid,
            });
          }
        });

        // Listen for errors in stderr
        this.process.stderr?.on('data', (data: Buffer) => {
          const output = data.toString();
          this.emitLog('error', output);
        });

        // Handle process exit
        this.process.on('exit', (code, signal) => {
          console.log(
            `[ViteLauncher] Process exited (code: ${code}, signal: ${signal})`
          );
          this.process = null;

          if (!urlResolved) {
            clearTimeout(timeout);
            reject(
              new Error(
                `Vite dev server failed to start (exit code: ${code}, signal: ${signal})`
              )
            );
          }
        });

        // Handle spawn errors
        this.process.on('error', (error) => {
          console.error('[ViteLauncher] Process error:', error);
          clearTimeout(timeout);
          this.cleanup();
          reject(
            new Error(`Failed to spawn Vite dev server: ${error.message}`)
          );
        });
      } catch (error) {
        clearTimeout(timeout);
        this.cleanup();
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.process) {
      console.warn('[ViteLauncher] No process to stop');
      return;
    }

    console.log('[ViteLauncher] Stopping Vite dev server...');

    return new Promise((resolve) => {
      if (!this.process) {
        resolve();
        return;
      }

      const timeout = setTimeout(() => {
        console.warn('[ViteLauncher] Graceful shutdown timeout, force killing');
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        this.cleanup();
        resolve();
      }, 5000);

      this.process.once('exit', () => {
        clearTimeout(timeout);
        this.cleanup();
        console.log('[ViteLauncher] Vite dev server stopped');
        resolve();
      });

      // Try graceful shutdown first
      this.process.kill('SIGTERM');
    });
  }

  onLog(callback: (entry: PreviewLogEntry) => void): Disposable {
    this.logListeners.push(callback);
    return {
      dispose: () => {
        const index = this.logListeners.indexOf(callback);
        if (index !== -1) {
          this.logListeners.splice(index, 1);
        }
      },
    };
  }

  private emitLog(level: 'info' | 'warn' | 'error' | 'debug', message: string) {
    const entry: PreviewLogEntry = {
      level,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.logListeners) {
      listener(entry);
    }
  }

  private cleanup() {
    if (this.process) {
      try {
        this.process.kill('SIGKILL');
      } catch (error) {
        // Ignore errors during cleanup
      }
      this.process = null;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Entry Point
// ─────────────────────────────────────────────────────────────────────────────

export function activate(context: ExtensionContext): void {
  console.log('[ViteLauncher] Activating...');

  const launcher = new ViteLauncher(context.workspaceRoot);

  context.preview.registerLauncher(launcher);
  console.log('[ViteLauncher] Registered Vite+React launcher');

  console.log('[ViteLauncher] Activated');
}

export function deactivate(): void {
  console.log('[ViteLauncher] Deactivated');
}
