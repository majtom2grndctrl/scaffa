import { ipcMain, BrowserWindow } from 'electron';
import {
  GetGraphSnapshotRequestSchema,
  GetGraphSnapshotResponseSchema,
  GraphPatchSchema,
  type GetGraphSnapshotRequest,
  type GetGraphSnapshotResponse,
  type GraphPatch,
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { projectGraphStore } from '../graph/graph-store.js';

// ─────────────────────────────────────────────────────────────────────────────
// Project Graph IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register project graph IPC handlers.
 */
export function registerGraphHandlers() {
  ipcMain.handle(
    'graph:getSnapshot',
    validated(
      GetGraphSnapshotRequestSchema,
      GetGraphSnapshotResponseSchema,
      async (
        _event,
        _request: GetGraphSnapshotRequest
      ): Promise<GetGraphSnapshotResponse> => {
        console.log('[IPC] graph:getSnapshot');
        return projectGraphStore.getSnapshot();
      }
    )
  );
}

/**
 * Apply a graph patch to the store and broadcast to all renderers.
 * This is called by producers (e.g., workspace scanner, runtime adapters).
 * Main assigns a global revision and broadcasts the patch with the global revision.
 */
export function applyGraphPatch(patch: GraphPatch): void {
  const globalRevision = projectGraphStore.applyPatch(patch);

  // Broadcast patch with the assigned global revision
  const globalPatch: GraphPatch = {
    ...patch,
    revision: globalRevision,
  };
  broadcastGraphPatch(globalPatch);
}

/**
 * Broadcast graph patch event to all renderer windows.
 */
export function broadcastGraphPatch(patch: GraphPatch) {
  const validated = validateEvent(GraphPatchSchema, patch, 'graph:patch');
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('graph:patch', validated);
  });
}
