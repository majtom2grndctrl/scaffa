// ─────────────────────────────────────────────────────────────────────────────
// Main Process IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Central registration point for all IPC handlers and event broadcasters.

import { registerPreviewHandlers } from './preview.js';
import { registerSelectionHandlers } from './selection.js';
import { registerOverrideHandlers } from './overrides.js';
import { registerGraphHandlers } from './graph.js';

/**
 * Register all IPC handlers for the v0 domains.
 * Call this once during main process initialization.
 */
export function registerAllIpcHandlers() {
  registerPreviewHandlers();
  registerSelectionHandlers();
  registerOverrideHandlers();
  registerGraphHandlers();
}

// Re-export broadcast functions for use by domain services
export * from './preview.js';
export * from './selection.js';
export * from './overrides.js';
export * from './graph.js';
