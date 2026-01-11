// ─────────────────────────────────────────────────────────────────────────────
// Extension Host Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Spawns and supervises the extension host process.

import { fork, type ChildProcess } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  MainToExtHostMessage,
  ExtHostToMainMessage,
  RegistryContributionMessage,
  GraphSnapshotMessage,
  GraphPatchMessage,
} from '../../extension-host/ipc-protocol.js';
import type { ComponentRegistry } from '../../shared/index.js';
import type { ScaffaConfig } from '../../shared/config.js';
import { registryManager } from '../registry/registry-manager.js';
import { applyGraphPatch } from '../ipc/graph.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Extension Host Manager
// ─────────────────────────────────────────────────────────────────────────────

export class ExtensionHostManager {
  private process: ChildProcess | null = null;
  private isReady = false;
  private shouldRestart = true;
  private restartCount = 0;
  private readonly maxRestarts = 5;
  private workspacePath: string | null = null;
  private config: ScaffaConfig | null = null;

  /**
   * Start the extension host process.
   */
  async start(workspacePath: string | null, config: ScaffaConfig): Promise<void> {
    if (this.process) {
      console.warn('[ExtHostManager] Extension host already running');
      return;
    }

    this.workspacePath = workspacePath;
    this.config = config;

    console.log('[ExtHostManager] Starting extension host...');
    await this.spawnProcess();
  }

  /**
   * Spawn the extension host process.
   */
  private async spawnProcess(): Promise<void> {
    // Resolve extension host entry point (relative to dist/main/)
    const extHostPath = join(__dirname, '../extension-host/main.js');

    console.log('[ExtHostManager] Spawning extension host process...');
    console.log('[ExtHostManager] Entry point:', extHostPath);

    // Spawn process
    this.process = fork(extHostPath, [], {
      stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      env: {
        ...process.env,
        SCAFFA_EXTENSION_HOST: '1',
      },
    });

    // Setup event handlers
    this.setupProcessHandlers();

    // Wait for process to be ready
    await this.waitForReady();

    // Send init message
    this.sendToExtHost({
      type: 'init',
      workspacePath: this.workspacePath,
      config: this.config!,
    });
  }

  /**
   * Setup process event handlers.
   */
  private setupProcessHandlers(): void {
    if (!this.process) return;

    // Handle messages from extension host
    this.process.on('message', (message: ExtHostToMainMessage) => {
      this.handleMessage(message);
    });

    // Handle process exit
    this.process.on('exit', (code, signal) => {
      console.log(`[ExtHostManager] Extension host exited (code: ${code}, signal: ${signal})`);
      this.process = null;
      this.isReady = false;

      if (this.shouldRestart && this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`[ExtHostManager] Restarting extension host (attempt ${this.restartCount}/${this.maxRestarts})...`);
        setTimeout(() => {
          void this.spawnProcess();
        }, 1000);
      } else if (this.restartCount >= this.maxRestarts) {
        console.error('[ExtHostManager] Max restart attempts reached, giving up');
      }
    });

    // Forward stdout/stderr
    this.process.stdout?.on('data', (data) => {
      console.log(`[ExtHost] ${data.toString().trim()}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`[ExtHost] ${data.toString().trim()}`);
    });

    // Handle errors
    this.process.on('error', (error) => {
      console.error('[ExtHostManager] Extension host process error:', error);
    });
  }

  /**
   * Wait for extension host to send ready message.
   */
  private waitForReady(): Promise<void> {
    return new Promise((resolve) => {
      const checkReady = () => {
        if (this.isReady) {
          resolve();
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    });
  }

  /**
   * Handle message from extension host.
   */
  private handleMessage(message: ExtHostToMainMessage): void {
    switch (message.type) {
      case 'ready':
        console.log('[ExtHostManager] Extension host ready');
        this.isReady = true;
        this.restartCount = 0; // Reset restart count on successful startup
        break;

      case 'registry-contribution':
        this.handleRegistryContribution(message);
        break;

      case 'graph-snapshot':
        this.handleGraphSnapshot(message);
        break;

      case 'graph-patch':
        this.handleGraphPatch(message);
        break;

      case 'error':
        console.error('[ExtHostManager] Extension host error:', message.error);
        break;

      default:
        console.warn('[ExtHostManager] Unknown message type:', (message as any).type);
    }
  }

  /**
   * Handle registry contribution from extension host.
   */
  private handleRegistryContribution(message: RegistryContributionMessage): void {
    console.log(`[ExtHostManager] Received ${message.registries.length} registry contribution(s)`);

    if (!this.config) {
      console.error('[ExtHostManager] No config available for registry composition');
      return;
    }

    // Update registry manager with module registries
    registryManager.updateRegistry(message.registries, this.config);
  }

  /**
   * Handle graph snapshot from extension host.
   */
  private handleGraphSnapshot(message: GraphSnapshotMessage): void {
    console.log(`[ExtHostManager] Received graph snapshot from producer: ${message.producerId}`);
    // v0: Snapshots are handled by initial patch with revision 1
    // Future: Support full snapshot replacement
  }

  /**
   * Handle graph patch from extension host.
   */
  private handleGraphPatch(message: GraphPatchMessage): void {
    console.log(
      `[ExtHostManager] Received graph patch from producer: ${message.producerId} (revision: ${message.patch.revision})`
    );
    applyGraphPatch(message.patch);
  }

  /**
   * Send message to extension host.
   */
  private sendToExtHost(message: MainToExtHostMessage): void {
    if (!this.process || !this.process.connected) {
      console.error('[ExtHostManager] Cannot send message: process not connected');
      return;
    }

    this.process.send(message);
  }

  /**
   * Notify extension host of config change.
   */
  updateConfig(config: ScaffaConfig): void {
    this.config = config;

    if (!this.isReady) {
      console.warn('[ExtHostManager] Extension host not ready, config change deferred');
      return;
    }

    this.sendToExtHost({
      type: 'config-changed',
      config,
    });
  }

  /**
   * Stop the extension host process gracefully.
   */
  async stop(): Promise<void> {
    if (!this.process) {
      return;
    }

    console.log('[ExtHostManager] Stopping extension host...');
    this.shouldRestart = false;

    // Send shutdown message
    this.sendToExtHost({ type: 'shutdown' });

    // Wait for graceful shutdown (with timeout)
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        console.warn('[ExtHostManager] Extension host shutdown timeout, killing process');
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        resolve();
      }, 5000);

      if (this.process) {
        this.process.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      } else {
        clearTimeout(timeout);
        resolve();
      }
    });

    this.process = null;
    this.isReady = false;
    console.log('[ExtHostManager] Extension host stopped');
  }
}

// Singleton instance
export const extensionHostManager = new ExtensionHostManager();
