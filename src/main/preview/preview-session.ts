// ─────────────────────────────────────────────────────────────────────────────
// Preview Session (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages a single preview session's WebContents, state, and runtime communication.

import { BrowserView, WebContents } from 'electron';
import type {
  PreviewSessionId,
  PreviewSessionTarget,
  PreviewSessionState,
  InstanceDescriptor,
} from '../../shared/index.js';
import type {
  RuntimeEvent,
  HostCommand,
  AdapterId,
  RuntimeCapabilities,
} from '../../shared/index.js';
import type { OverrideOp } from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Preview Session
// ─────────────────────────────────────────────────────────────────────────────

export interface PreviewSessionEventHandlers {
  onStateChange: (sessionId: PreviewSessionId, state: PreviewSessionState) => void;
  onError: (sessionId: PreviewSessionId, error: Error) => void;
  onRuntimeReady: (
    sessionId: PreviewSessionId,
    adapterId: AdapterId,
    adapterVersion: string,
    capabilities: RuntimeCapabilities
  ) => void;
  onSelectionChanged: (
    sessionId: PreviewSessionId,
    selected: InstanceDescriptor | null
  ) => void;
}

export class PreviewSession {
  readonly sessionId: PreviewSessionId;
  readonly target: PreviewSessionTarget;
  private view: BrowserView | null = null;
  private state: PreviewSessionState = 'creating';
  private handlers: PreviewSessionEventHandlers;
  private runtimeReady = false;

  constructor(
    sessionId: PreviewSessionId,
    target: PreviewSessionTarget,
    handlers: PreviewSessionEventHandlers
  ) {
    this.sessionId = sessionId;
    this.target = target;
    this.handlers = handlers;
  }

  /**
   * Get current session state.
   */
  getState(): PreviewSessionState {
    return this.state;
  }

  /**
   * Get the underlying WebContents.
   */
  getWebContents(): WebContents | null {
    return this.view?.webContents ?? null;
  }

  /**
   * Create the preview WebContents and load the target URL.
   */
  async start(): Promise<void> {
    try {
      this.setState('creating');

      // Create BrowserView for preview
      // Note: v0 uses BrowserView; future versions may support BrowserWindow or WebView
      const { join } = await import('node:path');
      const { fileURLToPath } = await import('node:url');
      const __dirname = fileURLToPath(new URL('.', import.meta.url));
      const runtimeTransportPreload = join(
        __dirname,
        '../../../dist/runtime-transport-preload/runtime-transport-preload.js'
      );

      this.view = new BrowserView({
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          // Runtime transport preload enables communication with runtime adapter
          preload: runtimeTransportPreload,
        },
      });

      // Setup WebContents event handlers
      this.setupWebContentsHandlers();

      // Load target URL
      this.setState('loading');
      const url = this.getTargetUrl();
      console.log(`[PreviewSession] Loading URL: ${url}`);
      await this.view.webContents.loadURL(url);

      console.log(`[PreviewSession] Session ${this.sessionId} started`);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Stop the session and clean up.
   */
  async stop(): Promise<void> {
    if (this.state === 'stopped' || this.state === 'disposed') {
      return;
    }

    console.log(`[PreviewSession] Stopping session ${this.sessionId}`);
    this.setState('stopped');

    // Clean up WebContents
    if (this.view) {
      // Remove from parent window if attached
      const webContents = this.view.webContents;
      if (!webContents.isDestroyed()) {
        webContents.closeDevTools();
      }
      // Destroy the view
      // @ts-expect-error - BrowserView doesn't have destroy in types, but it exists
      this.view.destroy?.();
      this.view = null;
    }

    this.setState('disposed');
  }

  /**
   * Send a command to the runtime adapter.
   */
  sendToRuntime(command: HostCommand): void {
    const webContents = this.getWebContents();
    if (!webContents || webContents.isDestroyed()) {
      console.warn(
        `[PreviewSession] Cannot send to runtime: WebContents destroyed for session ${this.sessionId}`
      );
      return;
    }

    // Send command via executeJavaScript to deliver to window.scaffaRuntime
    // The runtime adapter will listen for these commands
    const script = `
      if (window.__scaffaHostCommand) {
        window.__scaffaHostCommand(${JSON.stringify(command)});
      }
    `;
    webContents.executeJavaScript(script).catch((error) => {
      console.error('[PreviewSession] Failed to send command to runtime:', error);
    });
  }

  /**
   * Apply override operations to the runtime.
   */
  applyOverrides(ops: OverrideOp[]): void {
    if (!this.runtimeReady) {
      console.warn(
        `[PreviewSession] Cannot apply overrides: runtime not ready for session ${this.sessionId}`
      );
      return;
    }

    this.sendToRuntime({
      type: 'host.applyOverrides',
      sessionId: this.sessionId,
      ops,
    });
  }

  /**
   * Setup WebContents event handlers.
   */
  private setupWebContentsHandlers(): void {
    if (!this.view) return;

    const webContents = this.view.webContents;

    // Listen for runtime adapter messages
    // The runtime adapter will use ipcRenderer to send events to the main process
    webContents.ipc.on('runtime:event', (_event, runtimeEvent: RuntimeEvent) => {
      this.handleRuntimeEvent(runtimeEvent);
    });

    // Handle page load completion
    webContents.on('did-finish-load', () => {
      console.log(`[PreviewSession] Page loaded for session ${this.sessionId}`);
      // Wait for runtime.ready event before transitioning to 'ready' state
    });

    // Handle navigation
    webContents.on('did-navigate', (event, url) => {
      console.log(`[PreviewSession] Navigated to ${url}`);
      // Reset runtime ready state on navigation
      this.runtimeReady = false;
    });

    // Handle errors
    webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
      this.handleError(new Error(`Failed to load: ${errorDescription} (${errorCode})`));
    });

    webContents.on('render-process-gone', (_event, details) => {
      this.handleError(new Error(`Render process gone: ${details.reason}`));
    });
  }

  /**
   * Handle runtime adapter event.
   */
  private handleRuntimeEvent(event: RuntimeEvent): void {
    switch (event.type) {
      case 'runtime.ready':
        this.handleRuntimeReady(
          event.adapterId,
          event.adapterVersion,
          event.capabilities
        );
        break;

      case 'runtime.selectionChanged':
        this.handleSelectionChanged(event.selected);
        break;

      default:
        console.warn('[PreviewSession] Unknown runtime event:', (event as any).type);
    }
  }

  /**
   * Handle runtime.ready event.
   */
  private handleRuntimeReady(
    adapterId: AdapterId,
    adapterVersion: string,
    capabilities: RuntimeCapabilities
  ): void {
    console.log(
      `[PreviewSession] Runtime ready: ${adapterId}@${adapterVersion} for session ${this.sessionId}`
    );
    this.runtimeReady = true;
    this.setState('ready');

    // Notify session manager
    this.handlers.onRuntimeReady(
      this.sessionId,
      adapterId,
      adapterVersion,
      capabilities
    );
  }

  /**
   * Handle selection changed event.
   */
  private handleSelectionChanged(selected: InstanceDescriptor | null): void {
    console.log(`[PreviewSession] Selection changed for session ${this.sessionId}`);
    this.handlers.onSelectionChanged(this.sessionId, selected);
  }

  /**
   * Get the target URL for this session.
   */
  private getTargetUrl(): string {
    switch (this.target.type) {
      case 'app':
        return this.target.url;
      case 'component':
        // v0: Component sessions use harnessUrl if provided, otherwise error
        if (!this.target.harnessUrl) {
          throw new Error('Component session requires harnessUrl');
        }
        return this.target.harnessUrl;
      case 'variant':
        throw new Error('Variant sessions not supported in v0');
    }
  }

  /**
   * Update session state and notify handlers.
   */
  private setState(state: PreviewSessionState): void {
    this.state = state;
    this.handlers.onStateChange(this.sessionId, state);
  }

  /**
   * Handle error and transition to error state.
   */
  private handleError(error: Error): void {
    console.error(`[PreviewSession] Error in session ${this.sessionId}:`, error);
    this.setState('error');
    this.handlers.onError(this.sessionId, error);
  }
}
