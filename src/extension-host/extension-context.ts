// ─────────────────────────────────────────────────────────────────────────────
// Extension Context API (v0)
// ─────────────────────────────────────────────────────────────────────────────
// The sole entry point for extension modules to interact with Scaffa.

import type { ComponentRegistry } from '../shared/index.js';
import type { GraphPatch, GraphSnapshot } from '../shared/project-graph.js';
import type {
  PreviewLauncherDescriptor,
  PreviewLauncherOptions,
  PreviewLaunchResult,
  PreviewLogEntry,
} from '../shared/preview-session.js';
import type { DraftOverride, SavePlan } from '../shared/save.js';

// ─────────────────────────────────────────────────────────────────────────────
// Disposable Pattern
// ─────────────────────────────────────────────────────────────────────────────

export interface Disposable {
  dispose(): void | Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Context
// ─────────────────────────────────────────────────────────────────────────────

export interface ExtensionContext {
  /**
   * The Extension API version.
   */
  readonly apiVersion: string;

  /**
   * The extension ID.
   */
  readonly extensionId: string;

  /**
   * Workspace root path (null if no workspace).
   */
  readonly workspaceRoot: string | null;

  /**
   * Registry API for contributing component registries.
   */
  readonly registry: RegistryAPI;

  /**
   * Graph API for contributing graph producers.
   */
  readonly graph: GraphAPI;

  /**
   * Preview API for contributing preview launchers.
   */
  readonly preview: PreviewAPI;

  /**
   * Save API for promoting overrides to workspace edits.
   */
  readonly save: SaveAPI;

  /**
   * Subscriptions for automatic cleanup.
   * Extensions should push disposables here.
   */
  readonly subscriptions: Disposable[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry API
// ─────────────────────────────────────────────────────────────────────────────

export interface RegistryAPI {
  /**
   * Contribute a component registry.
   * @param registry - The component registry to contribute
   * @returns Disposable to remove the contribution
   */
  contributeRegistry(registry: ComponentRegistry): Disposable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Graph API (v0 stub)
// ─────────────────────────────────────────────────────────────────────────────

export interface GraphProducer {
  /**
   * Unique ID for this producer.
   */
  readonly id: string;

  /**
   * Initialize the producer and return initial snapshot.
   */
  initialize(): Promise<GraphSnapshot>;

  /**
   * Start producing patches.
   * @param onPatch - Callback to emit patches
   * @returns Disposable to stop producing
   */
  start(onPatch: (patch: GraphPatch) => void): Disposable;
}

export interface GraphAPI {
  /**
   * Register a graph producer.
   * @param producer - The graph producer to register
   * @returns Disposable to unregister the producer
   */
  registerProducer(producer: GraphProducer): Disposable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview API (Managed Sessions)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Preview launcher interface.
 * Modules implement this to provide toolchain-specific managed previews.
 */
export interface PreviewLauncher {
  /**
   * Launcher descriptor (metadata).
   */
  readonly descriptor: PreviewLauncherDescriptor;

  /**
   * Start the preview runtime.
   * @param options - Launcher-specific options (e.g. port, env)
   * @returns Promise resolving to launch result (URL + optional PID)
   */
  start(options: PreviewLauncherOptions): Promise<PreviewLaunchResult>;

  /**
   * Stop the preview runtime.
   * @returns Promise resolving when the runtime is stopped
   */
  stop(): Promise<void>;

  /**
   * Subscribe to log events from the preview runtime.
   * @param onLog - Callback for log entries
   * @returns Disposable to unsubscribe
   */
  onLog(onLog: (entry: PreviewLogEntry) => void): Disposable;
}

export interface PreviewAPI {
  /**
   * Register a preview launcher.
   * @param launcher - The preview launcher to register
   * @returns Disposable to unregister the launcher
   */
  registerLauncher(launcher: PreviewLauncher): Disposable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Save API (Override Promotion)
// ─────────────────────────────────────────────────────────────────────────────

export interface SavePromoter {
  /**
   * Unique promoter ID.
   */
  readonly id: string;

  /**
   * Human-friendly name.
   */
  readonly displayName: string;

  /**
   * Promote draft overrides into workspace edits.
   */
  promote(overrides: DraftOverride[]): Promise<SavePlan>;
}

export interface SaveAPI {
  /**
   * Register a save promoter.
   */
  registerPromoter(promoter: SavePromoter): Disposable;
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Module Interface
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extension module entry point.
 */
export interface ExtensionModule {
  /**
   * Activate the extension.
   * @param context - The extension context
   */
  activate(context: ExtensionContext): void | Promise<void>;

  /**
   * Deactivate the extension (optional).
   */
  deactivate?(): void | Promise<void>;
}
