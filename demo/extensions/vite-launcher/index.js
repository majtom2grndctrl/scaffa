// ─────────────────────────────────────────────────────────────────────────────
// Vite+React Launcher (v0) - Preview Launcher for Vite Dev Server
// ─────────────────────────────────────────────────────────────────────────────
// Launches and manages the Vite dev server for the demo app.

import { spawn } from 'node:child_process';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ─────────────────────────────────────────────────────────────────────────────
// Vite Launcher Implementation
// ─────────────────────────────────────────────────────────────────────────────

class ViteLauncher {
  descriptor = {
    id: 'vite-react',
    displayName: 'Vite + React',
    description: 'Launch Vite dev server for React applications',
    supportedSessionTypes: ['app'],
  };

  process = null;
  logListeners = [];
  appPath = '';
  workspaceRoot = null;

  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    // Resolve demo/app path relative to workspace root
    this.appPath = workspaceRoot
      ? join(workspaceRoot, 'app')
      : join(process.cwd(), 'demo', 'app');
  }

  async start(options, context) {
    if (this.process) {
      throw new Error('Launcher already running');
    }

    console.log('[ViteLauncher] Starting Vite dev server at:', this.appPath);

    const runnerPath = join(
      dirname(fileURLToPath(import.meta.url)),
      'runner.js'
    );

    // Prepare absolute paths for runner
    const entry = context.projectEntry
      ? (this.workspaceRoot ? resolve(this.workspaceRoot, context.projectEntry) : resolve(context.projectEntry))
      : undefined;

    const styles = context.projectStyles?.map(s =>
      this.workspaceRoot ? resolve(this.workspaceRoot, s) : resolve(s)
    );

    return new Promise((resolvePromise, reject) => {
      const timeout = setTimeout(() => {
        this.cleanup();
        reject(new Error('Vite dev server start timeout (30s)'));
      }, 30000);

      try {
        const env = {
          ...process.env,
          FORCE_COLOR: '0',
          SCAFFA_ROOT: this.appPath, // Runner runs in app dir
          // Pass the actual workspace root for resolving implementation hint paths
          // Implementation hints in registry are relative to workspace root, not app dir
          SCAFFA_WORKSPACE_ROOT: this.workspaceRoot || this.appPath,
          SCAFFA_ENTRY: entry || '',
          SCAFFA_STYLES: JSON.stringify(styles || []),
          // Pass registry snapshot for instrumentation matchers
          // See: docs/scaffa_harness_model.md (5.4-5.6)
          SCAFFA_REGISTRY: JSON.stringify(context.registrySnapshot || { schemaVersion: 'v0', components: {} }),
        };

        this.process = spawn('node', [runnerPath], {
          cwd: this.appPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          env,
        });

        let urlResolved = false;

        // Listen for URL in stdout
        this.process.stdout?.on('data', (data) => {
          const output = data.toString();
          console.log('[ViteLauncher] Runner stdout:', output.trim());
          this.emitLog('info', output);

          // Look for Vite's "Local: http://..." line
          const urlMatch = output.match(/Local:\s+(https?:\/\/[^\s]+)/i);
          if (urlMatch && !urlResolved) {
            urlResolved = true;
            clearTimeout(timeout);

            const url = urlMatch[1].trim();
            console.log('[ViteLauncher] Vite dev server ready at:', url);

            resolvePromise({
              url,
              pid: this.process?.pid,
            });
          }
        });

        // Listen for errors in stderr
        this.process.stderr?.on('data', (data) => {
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

  async stop() {
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

  onLog(callback) {
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

  emitLog(level, message) {
    const entry = {
      level,
      message: message.trim(),
      timestamp: new Date().toISOString(),
    };

    for (const listener of this.logListeners) {
      listener(entry);
    }
  }

  cleanup() {
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

export function activate(context) {
  console.log('[ViteLauncher] Activating...');

  const launcher = new ViteLauncher(context.workspaceRoot);

  context.preview.registerLauncher(launcher);
  console.log('[ViteLauncher] Registered Vite+React launcher');

  console.log('[ViteLauncher] Activated');
}

export function deactivate() {
  console.log('[ViteLauncher] Deactivated');
}
