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
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { z } from 'zod';

// ─────────────────────────────────────────────────────────────────────────────
// Override IPC Handlers (v0 Stub)
// ─────────────────────────────────────────────────────────────────────────────
// Full implementation will come in epic 7iq.6

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
        // Stub: Full implementation in 7iq.6
        console.log('[IPC] overrides:set', request);
      }
    )
  );

  ipcMain.handle(
    'overrides:clear',
    validated(
      ClearOverrideRequestSchema,
      z.void(),
      async (_event, request: ClearOverrideRequest): Promise<void> => {
        // Stub: Full implementation in 7iq.6
        console.log('[IPC] overrides:clear', request);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearInstance',
    validated(
      ClearInstanceOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearInstanceOverridesRequest): Promise<void> => {
        // Stub: Full implementation in 7iq.6
        console.log('[IPC] overrides:clearInstance', request);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearAll',
    validated(
      ClearAllOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearAllOverridesRequest): Promise<void> => {
        // Stub: Full implementation in 7iq.6
        console.log('[IPC] overrides:clearAll', request);
      }
    )
  );
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
