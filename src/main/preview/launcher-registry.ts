// ─────────────────────────────────────────────────────────────────────────────
// Preview Launcher Registry (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages registered preview launchers and coordinates start/stop operations.

import type {
  PreviewLauncherId,
  PreviewLauncherDescriptor,
  PreviewLauncherOptions,
  PreviewLaunchResult,
  PreviewLogEntry,
} from '../../shared/preview-session.js';
import { extensionHostManager } from '../extension-host/extension-host-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Managed launcher instance (actively running).
 */
interface ManagedLauncher {
  descriptor: PreviewLauncherDescriptor;
  result: PreviewLaunchResult;
  startedAt: Date;
}

/**
 * Pending launcher request.
 */
interface LauncherRequest {
  resolve: (result: PreviewLaunchResult) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// ─────────────────────────────────────────────────────────────────────────────
// Launcher Registry
// ─────────────────────────────────────────────────────────────────────────────

class LauncherRegistry {
  /**
   * All registered launchers (from extensions).
   */
  private launchers = new Map<PreviewLauncherId, PreviewLauncherDescriptor>();

  /**
   * Active (running) launchers.
   */
  private activeLaunchers = new Map<PreviewLauncherId, ManagedLauncher>();

  /**
   * Pending start/stop requests (keyed by requestId).
   */
  private pendingRequests = new Map<string, LauncherRequest>();

  /**
   * Log listeners (for forwarding to UI).
   */
  private logListeners: Array<(launcherId: PreviewLauncherId, entry: PreviewLogEntry) => void> =
    [];

  /**
   * Register a launcher descriptor (called when extension registers a launcher).
   */
  registerLauncher(descriptor: PreviewLauncherDescriptor): void {
    console.log(`[LauncherRegistry] Registering launcher: ${descriptor.id} (${descriptor.displayName})`);

    if (this.launchers.has(descriptor.id)) {
      console.warn(
        `[LauncherRegistry] Launcher ${descriptor.id} already registered, overwriting`
      );
    }

    this.launchers.set(descriptor.id, descriptor);
  }

  /**
   * Get all registered launchers.
   */
  getAllLaunchers(): PreviewLauncherDescriptor[] {
    return Array.from(this.launchers.values());
  }

  /**
   * Get a specific launcher descriptor.
   */
  getLauncher(launcherId: PreviewLauncherId): PreviewLauncherDescriptor | undefined {
    return this.launchers.get(launcherId);
  }

  /**
   * Check if a launcher is currently running.
   */
  isRunning(launcherId: PreviewLauncherId): boolean {
    return this.activeLaunchers.has(launcherId);
  }

  /**
   * Get an active launcher.
   */
  getActiveLauncher(launcherId: PreviewLauncherId): ManagedLauncher | undefined {
    return this.activeLaunchers.get(launcherId);
  }

  /**
   * Start a launcher.
   * @returns Promise resolving to launch result (URL + optional PID)
   */
  async startLauncher(
    launcherId: PreviewLauncherId,
    options: PreviewLauncherOptions
  ): Promise<PreviewLaunchResult> {
    // Validate launcher exists
    const descriptor = this.launchers.get(launcherId);
    if (!descriptor) {
      throw new Error(`Launcher ${launcherId} not registered`);
    }

    // Check if already running
    if (this.activeLaunchers.has(launcherId)) {
      throw new Error(`Launcher ${launcherId} is already running`);
    }

    console.log(`[LauncherRegistry] Starting launcher ${launcherId} with options:`, options);

    // Generate request ID
    const requestId = `launcher_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create promise to track request
    const resultPromise = new Promise<PreviewLaunchResult>((resolve, reject) => {
      // Set timeout (30 seconds)
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Launcher ${launcherId} start timeout`));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
    });

    // Send start request to extension host
    extensionHostManager.sendMessage({
      type: 'start-preview-launcher',
      launcherId,
      options,
      requestId,
    });

    console.log(
      `[LauncherRegistry] Sent start request for ${launcherId} (requestId: ${requestId})`
    );

    return resultPromise;
  }

  /**
   * Stop a launcher.
   */
  async stopLauncher(launcherId: PreviewLauncherId): Promise<void> {
    // Check if running
    if (!this.activeLaunchers.has(launcherId)) {
      throw new Error(`Launcher ${launcherId} is not running`);
    }

    console.log(`[LauncherRegistry] Stopping launcher ${launcherId}`);

    // Generate request ID
    const requestId = `launcher_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    // Create promise to track request
    const resultPromise = new Promise<void>((resolve, reject) => {
      // Set timeout (10 seconds)
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Launcher ${launcherId} stop timeout`));
      }, 10000);

      this.pendingRequests.set(requestId, {
        resolve: () => resolve(),
        reject,
        timeout,
      } as any);
    });

    // Send stop request to extension host
    extensionHostManager.sendMessage({
      type: 'stop-preview-launcher',
      launcherId,
      requestId,
    });

    console.log(`[LauncherRegistry] Sent stop request for ${launcherId} (requestId: ${requestId})`);

    return resultPromise;
  }

  /**
   * Handle launcher started message from extension host.
   */
  handleLauncherStarted(
    requestId: string,
    launcherId: PreviewLauncherId,
    result: PreviewLaunchResult
  ): void {
    console.log(`[LauncherRegistry] Launcher ${launcherId} started:`, result);

    // Find pending request
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      console.warn(`[LauncherRegistry] No pending request for ${requestId}`);
      return;
    }

    // Clear timeout
    clearTimeout(request.timeout);
    this.pendingRequests.delete(requestId);

    // Get descriptor
    const descriptor = this.launchers.get(launcherId);
    if (!descriptor) {
      request.reject(new Error(`Launcher ${launcherId} not found`));
      return;
    }

    // Store active launcher
    this.activeLaunchers.set(launcherId, {
      descriptor,
      result,
      startedAt: new Date(),
    });

    // Resolve promise
    request.resolve(result);
  }

  /**
   * Handle launcher stopped message from extension host.
   */
  handleLauncherStopped(requestId: string, launcherId: PreviewLauncherId): void {
    console.log(`[LauncherRegistry] Launcher ${launcherId} stopped`);

    // Remove from active launchers
    this.activeLaunchers.delete(launcherId);

    // Find pending request
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      console.warn(`[LauncherRegistry] No pending request for ${requestId}`);
      return;
    }

    // Clear timeout
    clearTimeout(request.timeout);
    this.pendingRequests.delete(requestId);

    // Resolve promise
    request.resolve(undefined as any);
  }

  /**
   * Handle launcher error message from extension host.
   */
  handleLauncherError(
    requestId: string,
    launcherId: PreviewLauncherId,
    error: { code: string; message: string; stack?: string }
  ): void {
    console.error(`[LauncherRegistry] Launcher ${launcherId} error:`, error);

    // Find pending request
    const request = this.pendingRequests.get(requestId);
    if (!request) {
      console.warn(`[LauncherRegistry] No pending request for ${requestId}`);
      return;
    }

    // Clear timeout
    clearTimeout(request.timeout);
    this.pendingRequests.delete(requestId);

    // Reject promise
    const err = new Error(error.message);
    err.name = error.code;
    if (error.stack) {
      err.stack = error.stack;
    }
    request.reject(err);
  }

  /**
   * Handle launcher log message from extension host.
   */
  handleLauncherLog(launcherId: PreviewLauncherId, entry: PreviewLogEntry): void {
    // Forward to all log listeners
    for (const listener of this.logListeners) {
      listener(launcherId, entry);
    }
  }

  /**
   * Subscribe to launcher logs.
   */
  onLog(listener: (launcherId: PreviewLauncherId, entry: PreviewLogEntry) => void): () => void {
    this.logListeners.push(listener);
    return () => {
      const index = this.logListeners.indexOf(listener);
      if (index !== -1) {
        this.logListeners.splice(index, 1);
      }
    };
  }

  /**
   * Clear all launchers (cleanup on app quit).
   */
  clear(): void {
    console.log('[LauncherRegistry] Clearing all launchers');
    this.launchers.clear();
    this.activeLaunchers.clear();

    // Reject all pending requests
    for (const [requestId, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeout);
      request.reject(new Error('Launcher registry cleared'));
    }
    this.pendingRequests.clear();
  }
}

// Singleton instance
export const launcherRegistry = new LauncherRegistry();
