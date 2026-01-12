// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Runtime Adapter Core (v0)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ScaffaAdapterConfig,
  InstanceIdentity,
  OverrideOp,
  PropPath,
  OverrideEntry,
} from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Transport Types (from preload)
// ─────────────────────────────────────────────────────────────────────────────

interface RuntimeTransport {
  sendToHost(event: RuntimeEvent): void;
  onCommand(callback: (command: HostCommand) => void): void;
}

interface RuntimeEvent {
  type: 'runtime.ready' | 'runtime.selectionChanged' | 'runtime.routerStateChanged';
  [key: string]: unknown;
}

interface HostCommand {
  type: 'host.init' | 'host.applyOverrides';
  sessionId?: string;
  initialOverrides?: OverrideOp[];
  ops?: OverrideOp[];
}

declare global {
  interface Window {
    scaffaRuntimeTransport?: RuntimeTransport;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Runtime Adapter
// ─────────────────────────────────────────────────────────────────────────────

export class ScaffaReactAdapter {
  private config: ScaffaAdapterConfig;
  private transport: RuntimeTransport | null = null;
  private sessionId: string | null = null;
  private overrides = new Map<string, Map<PropPath, unknown>>();
  private instanceRegistry = new Map<string, InstanceIdentity>();
  private selectionHandlers = new Set<(identity: InstanceIdentity | null) => void>();
  private overrideChangeHandlers = new Set<() => void>();
  private isReady = false;
  private selectedInstanceId: string | null = null;
  private hoveredInstanceId: string | null = null;
  private isAltHeld = false;

  constructor(config: ScaffaAdapterConfig) {
    this.config = config;
    this.log('Adapter initialized', config);
  }

  /**
   * Initialize the adapter and connect to host transport.
   */
  async init(): Promise<void> {
    // Get transport from preload
    this.transport = window.scaffaRuntimeTransport ?? null;
    if (!this.transport) {
      console.error('[ScaffaReactAdapter] Transport not available');
      return;
    }

    this.log('Transport connected');

    // Register command handler
    this.transport.onCommand((command) => {
      this.handleCommand(command);
    });

    this.ensurePreviewUxInjected();
    this.setupPreviewInputHandlers();

    // Emit runtime.ready
    this.sendToHost({
      type: 'runtime.ready',
      adapterId: this.config.adapterId,
      adapterVersion: this.config.adapterVersion,
      capabilities: {
        selection: true,
        overrides: true,
      },
    });

    this.isReady = true;
    this.log('Runtime ready');
  }

  /**
   * Register an instance with the adapter.
   */
  registerInstance(identity: InstanceIdentity): void {
    this.instanceRegistry.set(identity.instanceId, identity);
    this.log('Instance registered:', identity);
  }

  /**
   * Unregister an instance.
   */
  unregisterInstance(instanceId: string): void {
    this.instanceRegistry.delete(instanceId);
    this.log('Instance unregistered:', instanceId);
  }

  /**
   * Get overrides for a specific instance.
   */
  getOverrides(instanceId: string): Map<PropPath, unknown> {
    return this.overrides.get(instanceId) ?? new Map();
  }

  /**
   * Subscribe to selection changes.
   */
  onSelectionChange(handler: (identity: InstanceIdentity | null) => void): () => void {
    this.selectionHandlers.add(handler);
    return () => this.selectionHandlers.delete(handler);
  }

  /**
   * Subscribe to override changes.
   */
  onOverrideChange(handler: () => void): () => void {
    this.overrideChangeHandlers.add(handler);
    return () => this.overrideChangeHandlers.delete(handler);
  }

  /**
   * Handle command from host.
   */
  private handleCommand(command: HostCommand): void {
    this.log('Received command:', command);

    switch (command.type) {
      case 'host.init':
        this.handleInit(command.sessionId!, command.initialOverrides ?? []);
        break;

      case 'host.applyOverrides':
        this.handleApplyOverrides(command.ops ?? []);
        break;

      default:
        console.warn('[ScaffaReactAdapter] Unknown command:', (command as any).type);
    }
  }

  /**
   * Handle host.init command.
   */
  private handleInit(sessionId: string, initialOverrides: OverrideOp[]): void {
    this.sessionId = sessionId;
    this.log('Session initialized:', sessionId);

    // Apply initial overrides
    if (initialOverrides.length > 0) {
      this.handleApplyOverrides(initialOverrides);
    }
  }

  /**
   * Handle host.applyOverrides command.
   */
  private handleApplyOverrides(ops: OverrideOp[]): void {
    this.log('Applying overrides:', ops);

    for (const op of ops) {
      switch (op.op) {
        case 'set':
          this.setOverride(op.instanceId!, op.path!, op.value);
          break;

        case 'clear':
          this.clearOverride(op.instanceId!, op.path!);
          break;

        case 'clearInstance':
          this.clearInstanceOverrides(op.instanceId!);
          break;

        case 'clearAll':
          this.clearAllOverrides();
          break;
      }
    }

    // Notify override change handlers
    this.notifyOverrideChange();
  }

  /**
   * Set an override for an instance prop.
   */
  private setOverride(instanceId: string, path: PropPath, value: unknown): void {
    let instanceOverrides = this.overrides.get(instanceId);
    if (!instanceOverrides) {
      instanceOverrides = new Map();
      this.overrides.set(instanceId, instanceOverrides);
    }
    instanceOverrides.set(path, value);
    this.log(`Override set: ${instanceId}${path} =`, value);
  }

  /**
   * Clear an override for an instance prop.
   */
  private clearOverride(instanceId: string, path: PropPath): void {
    const instanceOverrides = this.overrides.get(instanceId);
    if (instanceOverrides) {
      instanceOverrides.delete(path);
      if (instanceOverrides.size === 0) {
        this.overrides.delete(instanceId);
      }
      this.log(`Override cleared: ${instanceId}${path}`);
    }
  }

  /**
   * Clear all overrides for an instance.
   */
  private clearInstanceOverrides(instanceId: string): void {
    this.overrides.delete(instanceId);
    this.log(`Instance overrides cleared: ${instanceId}`);
  }

  /**
   * Clear all overrides.
   */
  private clearAllOverrides(): void {
    this.overrides.clear();
    this.log('All overrides cleared');
  }

  /**
   * Injects minimal preview UX affordances (selection outlines + hint).
   */
  private ensurePreviewUxInjected(): void {
    const existingStyles = document.getElementById('scaffa-preview-ux-styles');
    if (!existingStyles) {
      const style = document.createElement('style');
      style.id = 'scaffa-preview-ux-styles';
      style.textContent = `
        [data-scaffa-instance-id][data-scaffa-pick-hover="true"] {
          outline: 2px solid #d946ef; /* fuchsia */
          outline-offset: 2px;
        }
        [data-scaffa-instance-id][data-scaffa-selected="true"] {
          outline: 3px solid #22d3ee; /* cyan */
          outline-offset: 2px;
        }
        [data-scaffa-instance-id][data-scaffa-selected="true"][data-scaffa-pick-hover="true"] {
          outline: 3px solid #22d3ee; /* selected wins */
        }
        #scaffa-preview-hint {
          position: fixed;
          top: 12px;
          left: 12px;
          z-index: 2147483647;
          pointer-events: none;
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
          font-size: 12px;
          line-height: 1.2;
          color: rgba(255, 255, 255, 0.95);
          background: rgba(0, 0, 0, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 10px;
          padding: 10px 12px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          opacity: 0;
          transform: translateY(-2px);
          animation: scaffaHintAppearAndFade 4s ease-out forwards;
        }
        @keyframes scaffaHintAppearAndFade {
          0% { opacity: 0; transform: translateY(-2px); }
          10% { opacity: 1; transform: translateY(0); }
          75% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(0); }
        }
        #scaffa-preview-hint kbd {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size: 11px;
          padding: 1px 6px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
      `.trim();
      document.head.appendChild(style);
    }

    const existingHint = document.getElementById('scaffa-preview-hint');
    if (!existingHint) {
      const hint = document.createElement('div');
      hint.id = 'scaffa-preview-hint';
      hint.innerHTML = `<div><kbd>Alt</kbd>+Click to inspect</div><div style="margin-top:6px; opacity:0.85"><kbd>Esc</kbd> clears selection</div>`;
      document.body.appendChild(hint);
      window.setTimeout(() => hint.remove(), 4500);
    }
  }

  /**
   * Setup input handlers for v0:
   * - Default: interact with the app normally
   * - Alt/Option+hover: show what will be selected
   * - Alt/Option+click: select instance (prevents app interaction)
   * - Esc: clears selection (only when something is selected)
   */
  private setupPreviewInputHandlers(): void {
    window.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Alt') {
          this.isAltHeld = true;
          return;
        }

        if (event.key === 'Escape' && this.selectedInstanceId) {
          event.preventDefault();
          event.stopPropagation();
          this.selectInstance(null);
        }
      },
      true
    );

    window.addEventListener(
      'keyup',
      (event) => {
        if (event.key === 'Alt') {
          this.isAltHeld = false;
          this.setHoveredInstanceId(null);
        }
      },
      true
    );

    document.addEventListener(
      'mousemove',
      (event) => {
        const target = event.target as HTMLElement | null;
        if (!this.isAltHeld || !target) {
          if (this.hoveredInstanceId) this.setHoveredInstanceId(null);
          return;
        }

        const instanceElement = target.closest('[data-scaffa-instance-id]') as HTMLElement | null;
        const instanceId = instanceElement?.getAttribute('data-scaffa-instance-id') ?? null;
        this.setHoveredInstanceId(instanceId);
      },
      true
    );

    document.addEventListener(
      'click',
      (event) => {
        if (!event.altKey) {
          return;
        }

        const target = event.target as HTMLElement | null;
        const instanceElement = target?.closest?.('[data-scaffa-instance-id]') as HTMLElement | null;

        event.preventDefault();
        event.stopPropagation();

        if (!instanceElement) {
          this.selectInstance(null);
          return;
        }

        const instanceId = instanceElement.getAttribute('data-scaffa-instance-id');
        if (!instanceId) {
          this.selectInstance(null);
          return;
        }

        const identity = this.instanceRegistry.get(instanceId) ?? null;
        if (!identity) {
          this.selectInstance(null);
          return;
        }

        this.selectInstance(identity);
      },
      true
    );
  }

  private setHoveredInstanceId(instanceId: string | null): void {
    if (this.hoveredInstanceId === instanceId) {
      return;
    }

    if (this.hoveredInstanceId) {
      const prev = this.getInstanceElement(this.hoveredInstanceId);
      if (prev) prev.removeAttribute('data-scaffa-pick-hover');
    }

    this.hoveredInstanceId = instanceId;

    if (instanceId) {
      const next = this.getInstanceElement(instanceId);
      if (next) next.setAttribute('data-scaffa-pick-hover', 'true');
    }
  }

  private setSelectedInstanceId(instanceId: string | null): void {
    if (this.selectedInstanceId === instanceId) {
      return;
    }

    if (this.selectedInstanceId) {
      const prev = this.getInstanceElement(this.selectedInstanceId);
      if (prev) prev.removeAttribute('data-scaffa-selected');
    }

    this.selectedInstanceId = instanceId;

    if (instanceId) {
      const next = this.getInstanceElement(instanceId);
      if (next) next.setAttribute('data-scaffa-selected', 'true');
    }
  }

  private getInstanceElement(instanceId: string): HTMLElement | null {
    try {
      return document.querySelector(`[data-scaffa-instance-id="${CSS.escape(instanceId)}"]`);
    } catch {
      return document.querySelector(`[data-scaffa-instance-id="${instanceId}"]`);
    }
  }

  /**
   * Select an instance and emit selection event.
   */
  private selectInstance(identity: InstanceIdentity | null): void {
    this.log('Selection changed:', identity);
    this.setSelectedInstanceId(identity?.instanceId ?? null);

    // Notify selection handlers
    this.selectionHandlers.forEach((handler) => handler(identity));

    // Emit to host
    if (!this.sessionId) {
      console.warn('[ScaffaReactAdapter] Cannot emit selection: no session ID');
      return;
    }

    this.sendToHost({
      type: 'runtime.selectionChanged',
      sessionId: this.sessionId,
      selected: identity
        ? {
            sessionId: this.sessionId,
            instanceId: identity.instanceId,
            componentTypeId: identity.componentTypeId,
            displayName: identity.displayName,
          }
        : null,
      causedBy: 'click',
    });
  }

  /**
   * Notify override change handlers (triggers re-render).
   */
  private notifyOverrideChange(): void {
    this.overrideChangeHandlers.forEach((handler) => handler());
  }

  /**
   * Send event to host.
   */
  private sendToHost(event: RuntimeEvent): void {
    if (!this.transport) {
      console.error('[ScaffaReactAdapter] Cannot send: transport not connected');
      return;
    }
    this.transport.sendToHost(event);
  }

  /**
   * Emit router state change event to host.
   */
  emitRouterStateChanged(routerState: {
    pathname: string;
    matchedRouteIds?: string[];
    matchedPaths?: string[];
  }): void {
    if (!this.sessionId) {
      console.warn('[ScaffaReactAdapter] Cannot emit router state: no session ID');
      return;
    }

    this.sendToHost({
      type: 'runtime.routerStateChanged',
      sessionId: this.sessionId,
      routerState,
    });

    this.log('Router state changed:', routerState);
  }

  /**
   * Debug logging.
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[ScaffaReactAdapter]', ...args);
    }
  }
}
