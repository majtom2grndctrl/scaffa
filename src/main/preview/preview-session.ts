// ─────────────────────────────────────────────────────────────────────────────
// Preview Session (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages a single preview session's WebContents, state, and runtime communication.

import { BrowserView, BrowserWindow, WebContents, shell } from 'electron';
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
   * Get the BrowserView for this session.
   */
  getBrowserView(): BrowserView | null {
    return this.view;
  }

  /**
   * Attach the preview BrowserView to a BrowserWindow and set its bounds.
   */
  attachToWindow(window: BrowserWindow, bounds: { x: number; y: number; width: number; height: number }): void {
    if (!this.view) {
      console.warn(`[PreviewSession] Cannot attach: no BrowserView for session ${this.sessionId}`);
      return;
    }

    // Add the BrowserView to the window if not already added
    const existingViews = window.getBrowserViews();
    if (!existingViews.includes(this.view)) {
      console.log(`[PreviewSession] Adding BrowserView to window (${existingViews.length} views currently attached)`);
      window.addBrowserView(this.view);
      console.log(`[PreviewSession] BrowserView added (now ${window.getBrowserViews().length} views attached)`);
    } else {
      console.log(`[PreviewSession] BrowserView already attached to window`);
    }

    // Set bounds
    this.view.setBounds(bounds);
    console.log(`[PreviewSession] Set BrowserView bounds:`, bounds);

    console.log(`[PreviewSession] Attached session ${this.sessionId} to window with bounds:`, bounds);
  }

  /**
   * Update the bounds of the preview BrowserView.
   */
  setBounds(bounds: { x: number; y: number; width: number; height: number }): void {
    if (!this.view) {
      console.warn(`[PreviewSession] Cannot set bounds: no BrowserView for session ${this.sessionId}`);
      return;
    }

    this.view.setBounds(bounds);
  }

  /**
   * Detach the preview BrowserView from its parent window.
   */
  detachFromWindow(window: BrowserWindow): void {
    if (!this.view) {
      return;
    }

    if (window.getBrowserViews().includes(this.view)) {
      window.removeBrowserView(this.view);
      console.log(`[PreviewSession] Detached session ${this.sessionId} from window`);
    }
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
        '../runtime-transport-preload/runtime-transport-preload.js'
      );

      this.view = new BrowserView({
        webPreferences: {
          contextIsolation: true,
          nodeIntegration: false,
          // Runtime transport preload enables communication with runtime adapter
          preload: runtimeTransportPreload,
        },
      });

      // Set background color so BrowserView is visible even when loading
      this.view.setBackgroundColor('#1e1e1e');

      // Disable auto-resize - we'll manage bounds manually
      this.view.setAutoResize({
        width: false,
        height: false,
        horizontal: false,
        vertical: false,
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
  async stop(window?: BrowserWindow): Promise<void> {
    if (this.state === 'stopped' || this.state === 'disposed') {
      return;
    }

    console.log(`[PreviewSession] Stopping session ${this.sessionId}`);
    this.setState('stopped');

    // Clean up WebContents
    if (this.view) {
      // Detach from window if provided
      if (window) {
        this.detachFromWindow(window);
      }

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

    // ─────────────────────────────────────────────────────────────────────────
    // Navigation Policy (v0)
    // ─────────────────────────────────────────────────────────────────────────
    // Prevent preview content from spawning new Electron windows or navigating
    // to external origins. See: scaffa-0rp, docs/scaffa_preview_session_protocol.md

    // Block window.open() and <a target="_blank"> from creating new Electron windows
    webContents.setWindowOpenHandler((details) => {
      const { url } = details;
      console.log(`[PreviewSession] [Navigation Policy] window.open blocked: ${url}`);

      // v0 policy: never create new Electron windows from preview content
      // Future: In Preview Mode, open external URLs in system browser
      if (this.isExternalUrl(url)) {
        console.log(`[PreviewSession] [Navigation Policy] Opening external URL in system browser: ${url}`);
        shell.openExternal(url).catch((error) => {
          console.error(`[PreviewSession] [Navigation Policy] Failed to open external URL:`, error);
        });
      } else {
        console.log(`[PreviewSession] [Navigation Policy] Same-origin window.open blocked (not navigating): ${url}`);
      }

      // Always deny window creation
      return { action: 'deny' as const };
    });

    // Block top-frame navigation to external origins
    webContents.on('will-navigate', (event, url) => {
      // Allow same-origin navigation
      if (!this.isExternalUrl(url)) {
        console.log(`[PreviewSession] [Navigation Policy] Allowing same-origin navigation: ${url}`);
        return;
      }

      // Block external navigation and open in system browser
      console.log(`[PreviewSession] [Navigation Policy] Blocking external navigation: ${url}`);
      event.preventDefault();

      console.log(`[PreviewSession] [Navigation Policy] Opening external URL in system browser: ${url}`);
      shell.openExternal(url).catch((error) => {
        console.error(`[PreviewSession] [Navigation Policy] Failed to open external URL:`, error);
      });
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
   * Check if a URL is external to the session's origin.
   * Returns true if the URL has a different origin than the session target.
   */
  private isExternalUrl(url: string): boolean {
    try {
      const targetUrl = new URL(this.getTargetUrl());
      const candidateUrl = new URL(url);

      // Compare origin (protocol + host + port)
      return targetUrl.origin !== candidateUrl.origin;
    } catch {
      // If URL parsing fails, treat as external for safety
      return true;
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
