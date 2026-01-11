import { ipcMain, BrowserWindow } from 'electron';
import {
  SetOverrideRequestSchema,
  ClearOverrideRequestSchema,
  ClearInstanceOverridesRequestSchema,
  ClearAllOverridesRequestSchema,
  OverridesChangedEventSchema,
  type SetOverrideRequest,
  type ClearOverrideRequest,
  type ClearInstanceOverridesRequest,
  type ClearAllOverridesRequest,
  type OverridesChangedEvent,
  type OverrideOp,
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { z } from 'zod';
import { overrideStore } from '../overrides/override-store.js';
import { previewSessionManager } from '../preview/preview-session-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Override IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register override IPC handlers.
 */
export function registerOverrideHandlers() {
  ipcMain.handle(
    'overrides:set',
    validated(
      SetOverrideRequestSchema,
      z.void(),
      async (_event, request: SetOverrideRequest): Promise<void> => {
        console.log('[IPC] overrides:set', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'set',
            instanceId: request.instanceId,
            path: request.path,
            value: request.value,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clear',
    validated(
      ClearOverrideRequestSchema,
      z.void(),
      async (_event, request: ClearOverrideRequest): Promise<void> => {
        console.log('[IPC] overrides:clear', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clear',
            instanceId: request.instanceId,
            path: request.path,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearInstance',
    validated(
      ClearInstanceOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearInstanceOverridesRequest): Promise<void> => {
        console.log('[IPC] overrides:clearInstance', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clearInstance',
            instanceId: request.instanceId,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearAll',
    validated(
      ClearAllOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearAllOverridesRequest): Promise<void> => {
        console.log('[IPC] overrides:clearAll', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clearAll',
          },
        ]);
      }
    )
  );
}

/**
 * Apply override operations and notify affected parties.
 */
async function applyOverrideOps(sessionId: string, ops: OverrideOp[]): Promise<void> {
  // Get session to determine target type
  const session = previewSessionManager.getSession(sessionId as any);
  if (!session) {
    console.error(`[IPC] Cannot apply overrides: session ${sessionId} not found`);
    return;
  }

  // Apply to override store
  await overrideStore.applyOps(sessionId as any, session.target, ops);

  // Forward to runtime adapter
  previewSessionManager.applyOverrides(sessionId as any, ops);

  // Broadcast to renderer
  const allOverrides = overrideStore.getSessionOverrides(sessionId as any);
  broadcastOverridesChanged({
    sessionId: sessionId as any,
    overrides: allOverrides.map((op) => ({
      instanceId: op.instanceId! as string,
      path: op.path! as string,
      value: op.value!,
    })),
  });
}

/**
 * Broadcast overrides changed event to all renderer windows.
 */
export function broadcastOverridesChanged(event: OverridesChangedEvent) {
  const validated = validateEvent(
    OverridesChangedEventSchema,
    event,
    'overrides:changed'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('overrides:changed', validated);
  });
}
