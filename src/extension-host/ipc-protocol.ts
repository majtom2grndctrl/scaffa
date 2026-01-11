// ─────────────────────────────────────────────────────────────────────────────
// Extension Host IPC Protocol (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Communication protocol between Main Process and Extension Host Process.
// Uses Node.js IPC (process.send / process.on('message')).

import type { ComponentRegistry } from '../shared/index.js';
import type { GraphPatch } from '../shared/project-graph.js';
import type { ScaffaConfig } from '../shared/config.js';

// ─────────────────────────────────────────────────────────────────────────────
// Main → Extension Host Messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the extension host with workspace and config.
 */
export interface InitMessage {
  type: 'init';
  workspacePath: string | null;
  config: ScaffaConfig;
}

/**
 * Notify extension host of config change.
 */
export interface ConfigChangedMessage {
  type: 'config-changed';
  config: ScaffaConfig;
}

/**
 * Shutdown extension host gracefully.
 */
export interface ShutdownMessage {
  type: 'shutdown';
}

export type MainToExtHostMessage =
  | InitMessage
  | ConfigChangedMessage
  | ShutdownMessage;

// ─────────────────────────────────────────────────────────────────────────────
// Extension Host → Main Messages
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extension host is ready and initialized.
 */
export interface ReadyMessage {
  type: 'ready';
}

/**
 * Module contributed component registries.
 * Sent after all modules are activated.
 */
export interface RegistryContributionMessage {
  type: 'registry-contribution';
  registries: ComponentRegistry[];
}

/**
 * Module produced a graph snapshot.
 */
export interface GraphSnapshotMessage {
  type: 'graph-snapshot';
  producerId: string;
  snapshot: unknown; // TODO: GraphSnapshot schema
}

/**
 * Module produced a graph patch.
 */
export interface GraphPatchMessage {
  type: 'graph-patch';
  producerId: string;
  patch: GraphPatch;
}

/**
 * Extension host encountered an error.
 */
export interface ErrorMessage {
  type: 'error';
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

export type ExtHostToMainMessage =
  | ReadyMessage
  | RegistryContributionMessage
  | GraphSnapshotMessage
  | GraphPatchMessage
  | ErrorMessage;
