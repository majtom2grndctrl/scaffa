// ─────────────────────────────────────────────────────────────────────────────
// Extension Host IPC Protocol (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Communication protocol between Main Process and Extension Host Process.
// Uses Node.js IPC (process.send / process.on('message')).

import type { ComponentRegistry } from '../shared/index.js';
import type { GraphPatch } from '../shared/project-graph.js';
import type { ScaffaConfig } from '../shared/config.js';
import type { DraftOverride, SavePlan } from '../shared/save.js';
import type {
  PreviewLauncherDescriptor,
  PreviewLauncherOptions,
  PreviewLaunchResult,
  PreviewLogEntry,
  PreviewLauncherId,
} from '../shared/preview-session.js';

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

/**
 * Request to start a preview launcher.
 */
export interface StartPreviewLauncherMessage {
  type: 'start-preview-launcher';
  launcherId: PreviewLauncherId;
  options: PreviewLauncherOptions;
  requestId: string; // For correlating responses
}

/**
 * Request to stop a preview launcher.
 */
export interface StopPreviewLauncherMessage {
  type: 'stop-preview-launcher';
  launcherId: PreviewLauncherId;
  requestId: string; // For correlating responses
}

/**
 * Request to promote draft overrides into workspace edits.
 */
export interface PromoteOverridesMessage {
  type: 'promote-overrides';
  requestId: string;
  overrides: DraftOverride[];
}

export type MainToExtHostMessage =
  | InitMessage
  | ConfigChangedMessage
  | ShutdownMessage
  | StartPreviewLauncherMessage
  | StopPreviewLauncherMessage
  | PromoteOverridesMessage;

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

/**
 * Module registered a preview launcher.
 */
export interface LauncherRegisteredMessage {
  type: 'launcher-registered';
  descriptor: PreviewLauncherDescriptor;
}

/**
 * Preview launcher started successfully.
 */
export interface PreviewLauncherStartedMessage {
  type: 'preview-launcher-started';
  requestId: string;
  launcherId: PreviewLauncherId;
  result: PreviewLaunchResult;
}

/**
 * Preview launcher stopped.
 */
export interface PreviewLauncherStoppedMessage {
  type: 'preview-launcher-stopped';
  requestId: string;
  launcherId: PreviewLauncherId;
}

/**
 * Preview launcher encountered an error.
 */
export interface PreviewLauncherErrorMessage {
  type: 'preview-launcher-error';
  requestId: string;
  launcherId: PreviewLauncherId;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * Log entry from preview launcher.
 */
export interface PreviewLauncherLogMessage {
  type: 'preview-launcher-log';
  launcherId: PreviewLauncherId;
  entry: PreviewLogEntry;
}

/**
 * Promotion result for draft overrides.
 */
export interface PromoteOverridesResultMessage {
  type: 'promote-overrides-result';
  requestId: string;
  result: SavePlan;
}

/**
 * Promotion error for draft overrides.
 */
export interface PromoteOverridesErrorMessage {
  type: 'promote-overrides-error';
  requestId: string;
  error: {
    code: string;
    message: string;
    stack?: string;
  };
}

/**
 * Module activation status report.
 * Sent after module loading completes (success or failure).
 */
export interface ModuleActivationStatusMessage {
  type: 'module-activation-status';
  moduleId: string;
  status: 'success' | 'failed';
  error?: {
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
  | ErrorMessage
  | LauncherRegisteredMessage
  | PreviewLauncherStartedMessage
  | PreviewLauncherStoppedMessage
  | PreviewLauncherErrorMessage
  | PreviewLauncherLogMessage
  | ModuleActivationStatusMessage
  | PromoteOverridesResultMessage
  | PromoteOverridesErrorMessage;
