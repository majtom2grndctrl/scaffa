// ─────────────────────────────────────────────────────────────────────────────
// Main Process IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Central registration point for all IPC handlers and event broadcasters.

import { registerPreviewHandlers } from './preview.js';
import { registerSelectionHandlers } from './selection.js';
import { registerOverrideHandlers } from './overrides.js';
import { registerGraphHandlers } from './graph.js';
import { registerWorkspaceHandlers } from './workspace.js';
import { registerConfigHandlers } from './config.js';
import { registerRegistryHandlers } from './registry.js';
import { registerInspectorHandlers } from './inspector.js';

/**
 * Register all IPC handlers for the v0 domains.
 * Call this once during main process initialization.
 */
export function registerAllIpcHandlers() {
  registerWorkspaceHandlers();
  registerConfigHandlers();
  registerRegistryHandlers();
  registerPreviewHandlers();
  registerSelectionHandlers();
  registerOverrideHandlers();
  registerGraphHandlers();
  registerInspectorHandlers();
}

// Re-export broadcast functions for use by domain services
export * from './workspace.js';
export * from './config.js';
export * from './registry.js';
export * from './preview.js';
export * from './selection.js';
export * from './overrides.js';
export * from './graph.js';
export * from './inspector.js';
