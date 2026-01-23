import { ipcMain, BrowserWindow } from 'electron';
import {
  GetGraphSnapshotRequestSchema,
  GetGraphSnapshotResponseSchema,
  GraphPatchSchema,
  type GetGraphSnapshotRequest,
  type GetGraphSnapshotResponse,
  type GraphPatch,
  type GraphSnapshot,
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
 * Apply a producer snapshot with full replacement semantics.
 * This is the preferred way to ingest snapshots from graph producers.
 *
 * Producer-scoped replacement:
 * - Nodes/edges owned by this producer but not in the snapshot are removed
 * - All nodes/edges in the snapshot are upserted
 * - Changes are broadcast as a single patch to all renderers
 *
 * @param producerId - The ID of the producer sending the snapshot
 * @param snapshot - The graph snapshot from the producer
 */
export function applyGraphSnapshot(producerId: string, snapshot: GraphSnapshot): void {
  // Apply snapshot with producer-scoped replacement semantics
  const { patch } = projectGraphStore.applySnapshot(producerId, snapshot);

  // Broadcast the patch (with remove + upsert ops) to all renderers
  broadcastGraphPatch(patch);
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
