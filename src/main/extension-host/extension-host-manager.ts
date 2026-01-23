// ─────────────────────────────────────────────────────────────────────────────
// Extension Host Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Spawns and supervises the extension host process.

import { fork, type ChildProcess } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type {
  MainToExtHostMessage,
  ExtHostToMainMessage,
  RegistryContributionMessage,
  GraphSnapshotMessage,
  GraphPatchMessage,
  LauncherRegisteredMessage,
  PreviewLauncherStartedMessage,
  PreviewLauncherStoppedMessage,
  PreviewLauncherErrorMessage,
  PreviewLauncherLogMessage,
  ModuleActivationStatusMessage,
  PromoteOverridesResultMessage,
  PromoteOverridesErrorMessage,
  InspectorSectionRegisteredMessage,
} from '../../extension-host/ipc-protocol.js';
import type { ComponentRegistry } from '../../shared/index.js';
import type { ScaffaConfig } from '../../shared/config.js';
import type { DraftOverride, SavePlan } from '../../shared/save.js';
import { registryManager } from '../registry/registry-manager.js';
import { applyGraphPatch, applyGraphSnapshot } from '../ipc/graph.js';
import { launcherRegistry } from '../preview/launcher-registry.js';
import { inspectorSectionRegistry } from '../inspector/inspector-section-registry.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// ─────────────────────────────────────────────────────────────────────────────
// Module Activation Status
// ─────────────────────────────────────────────────────────────────────────────

export interface ModuleActivationStatus {
  moduleId: string;
  status: 'success' | 'failed';
  error?: {
    code: string;
    message: string;
    stack?: string;
  };
}

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
  private moduleActivationStatuses: Map<string, ModuleActivationStatus> = new Map();
  private pendingPromotions = new Map<
    string,
    { resolve: (result: SavePlan) => void; reject: (error: Error) => void }
  >();

  /**
   * Start the extension host process.
   */
  async start(workspacePath: string | null, config: ScaffaConfig): Promise<void> {
    if (this.process) {
      console.warn('[ExtHostManager] Extension host already running');
      return;
    }

    this.shouldRestart = true;
    this.restartCount = 0;
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

    // Send init message
    this.sendToExtHost({
      type: 'init',
      workspacePath: this.workspacePath,
      config: this.config!,
    });

    // Wait for process to be ready
    await this.waitForReady();
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

      case 'launcher-registered':
        this.handleLauncherRegistered(message);
        break;

      case 'preview-launcher-started':
        this.handlePreviewLauncherStarted(message);
        break;

      case 'preview-launcher-stopped':
        this.handlePreviewLauncherStopped(message);
        break;

      case 'preview-launcher-error':
        this.handlePreviewLauncherError(message);
        break;

      case 'preview-launcher-log':
        this.handlePreviewLauncherLog(message);
        break;

      case 'module-activation-status':
        this.handleModuleActivationStatus(message);
        break;

      case 'promote-overrides-result':
        this.handlePromoteOverridesResult(message);
        break;

      case 'promote-overrides-error':
        this.handlePromoteOverridesError(message);
        break;

      case 'inspector-section-registered':
        this.handleInspectorSectionRegistered(message);
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

    // Log details of each registry contribution
    for (const registry of message.registries) {
      const componentIds = Object.keys(registry.components);
      console.log(`[ExtHostManager]   - Registry with ${componentIds.length} component(s): ${componentIds.join(', ') || '(none)'}`);
    }

    if (!this.config) {
      console.error('[ExtHostManager] No config available for registry composition');
      return;
    }

    // Update registry manager with module registries
    registryManager.updateRegistry(message.registries, this.config);

    // Log the effective registry after update
    const effective = registryManager.getEffectiveRegistry();
    console.log(`[ExtHostManager] Effective registry now has ${Object.keys(effective.components).length} component(s)`);
  }

  /**
   * Handle graph snapshot from extension host.
   */
  private handleGraphSnapshot(message: GraphSnapshotMessage): void {
    console.log(
      `[ExtHostManager] Received graph snapshot from producer: ${message.producerId} (revision: ${message.snapshot.revision})`
    );

    // Apply snapshot with producer-scoped replacement semantics
    // Nodes/edges owned by this producer but not in the snapshot are removed
    applyGraphSnapshot(message.producerId, message.snapshot as any);
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
   * Handle launcher registered from extension host.
   */
  private handleLauncherRegistered(message: LauncherRegisteredMessage): void {
    console.log(`[ExtHostManager] Launcher registered: ${message.descriptor.id}`);
    launcherRegistry.registerLauncher(message.descriptor);
  }

  /**
   * Handle preview launcher started from extension host.
   */
  private handlePreviewLauncherStarted(message: PreviewLauncherStartedMessage): void {
    console.log(
      `[ExtHostManager] Preview launcher started: ${message.launcherId} (${message.requestId})`
    );
    launcherRegistry.handleLauncherStarted(
      message.requestId,
      message.launcherId,
      message.result
    );
  }

  /**
   * Handle preview launcher stopped from extension host.
   */
  private handlePreviewLauncherStopped(message: PreviewLauncherStoppedMessage): void {
    console.log(
      `[ExtHostManager] Preview launcher stopped: ${message.launcherId} (${message.requestId})`
    );
    launcherRegistry.handleLauncherStopped(message.requestId, message.launcherId);
  }

  /**
   * Handle preview launcher error from extension host.
   */
  private handlePreviewLauncherError(message: PreviewLauncherErrorMessage): void {
    console.error(
      `[ExtHostManager] Preview launcher error: ${message.launcherId} (${message.requestId})`,
      message.error
    );
    launcherRegistry.handleLauncherError(message.requestId, message.launcherId, message.error);
  }

  /**
   * Handle preview launcher log from extension host.
   */
  private handlePreviewLauncherLog(message: PreviewLauncherLogMessage): void {
    launcherRegistry.handleLauncherLog(message.launcherId, message.entry);
  }

  /**
   * Handle module activation status from extension host.
   */
  private handleModuleActivationStatus(message: ModuleActivationStatusMessage): void {
    const { moduleId, status, error } = message;

    if (status === 'success') {
      console.log(`[ExtHostManager] Module activated successfully: ${moduleId}`);
    } else {
      console.error(`[ExtHostManager] Module activation failed: ${moduleId}`, error);
    }

    // Store the status
    this.moduleActivationStatuses.set(moduleId, { moduleId, status, error });
  }

  private handlePromoteOverridesResult(message: PromoteOverridesResultMessage): void {
    const pending = this.pendingPromotions.get(message.requestId);
    if (!pending) {
      console.warn(
        `[ExtHostManager] Received promotion result for unknown request ${message.requestId}`
      );
      return;
    }

    this.pendingPromotions.delete(message.requestId);
    pending.resolve(message.result);
  }

  private handlePromoteOverridesError(message: PromoteOverridesErrorMessage): void {
    const pending = this.pendingPromotions.get(message.requestId);
    if (!pending) {
      console.warn(
        `[ExtHostManager] Received promotion error for unknown request ${message.requestId}`
      );
      return;
    }

    this.pendingPromotions.delete(message.requestId);
    pending.reject(new Error(message.error.message));
  }

  /**
   * Handle inspector section registered from extension host.
   */
  private handleInspectorSectionRegistered(message: InspectorSectionRegisteredMessage): void {
    console.log(`[ExtHostManager] Inspector section registered: ${message.section.id}`);
    inspectorSectionRegistry.registerSection(message.section);
  }

  /**
   * Get module activation statuses.
   */
  getModuleActivationStatuses(): ModuleActivationStatus[] {
    return Array.from(this.moduleActivationStatuses.values());
  }

  /**
   * Clear module activation statuses (when reloading config).
   */
  clearModuleActivationStatuses(): void {
    this.moduleActivationStatuses.clear();
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
   * Send message to extension host (public method for launcher registry).
   */
  sendMessage(message: MainToExtHostMessage): void {
    this.sendToExtHost(message);
  }

  async promoteOverrides(overrides: DraftOverride[]): Promise<SavePlan> {
    if (!this.process || !this.process.connected) {
      throw new Error('Extension host not connected');
    }

    const requestId = `promote_${randomBytes(12).toString('hex')}`;
    const result = new Promise<SavePlan>((resolve, reject) => {
      this.pendingPromotions.set(requestId, { resolve, reject });
    });

    this.sendToExtHost({
      type: 'promote-overrides',
      requestId,
      overrides,
    });

    return result;
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
    await this.stopInternal();
  }

  /**
   * Restart the extension host with a new workspace + config.
   */
  async restart(workspacePath: string | null, config: ScaffaConfig): Promise<void> {
    await this.stopInternal();
    this.clearModuleActivationStatuses();
    inspectorSectionRegistry.clear();
    await this.start(workspacePath, config);
  }

  /**
   * Stop the extension host process with restart control.
   */
  private async stopInternal(): Promise<void> {
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
