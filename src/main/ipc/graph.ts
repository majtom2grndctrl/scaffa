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

// ─────────────────────────────────────────────────────────────────────────────
// Project Graph IPC Handlers (v0 Stub)
// ─────────────────────────────────────────────────────────────────────────────
// Full implementation will come in epic 7iq.8

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
        // Stub: Full implementation in 7iq.8
        console.log('[IPC] graph:getSnapshot');
        return {
          schemaVersion: 'v0',
          revision: 0,
          nodes: [],
          edges: [],
        };
      }
    )
  );
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
