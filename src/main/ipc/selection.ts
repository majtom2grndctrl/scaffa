import { BrowserWindow } from 'electron';
import {
  SelectionChangedEventSchema,
  type SelectionChangedEvent,
} from '../../shared/index.js';
import { validateEvent } from './validation.js';

// ─────────────────────────────────────────────────────────────────────────────
// Selection IPC Handlers (v0 Stub)
// ─────────────────────────────────────────────────────────────────────────────
// Full implementation will come in epic 7iq.4

/**
 * Register selection IPC handlers.
 * Note: Selection is event-driven (runtime → main → renderer), no invoke handlers needed.
 */
export function registerSelectionHandlers() {
  // No ipcMain.handle needed for v0 - selection is push-only from runtime adapter
}

/**
 * Broadcast selection changed event to all renderer windows.
 */
export function broadcastSelectionChanged(event: SelectionChangedEvent) {
  const validated = validateEvent(
    SelectionChangedEventSchema,
    event,
    'selection:changed'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('selection:changed', validated);
  });
}
