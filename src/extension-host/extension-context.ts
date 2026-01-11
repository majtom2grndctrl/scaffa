// ─────────────────────────────────────────────────────────────────────────────
// Extension Context API (v0)
// ─────────────────────────────────────────────────────────────────────────────
// The sole entry point for extension modules to interact with Scaffa.

import type { ComponentRegistry } from '../shared/index.js';
import type { GraphPatch } from '../shared/project-graph.js';

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
  initialize(): Promise<unknown>; // TODO: GraphSnapshot type

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
