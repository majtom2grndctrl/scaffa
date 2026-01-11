import { ipcMain, BrowserWindow } from 'electron';
import {
  StartSessionRequestSchema,
  StartSessionResponseSchema,
  StopSessionRequestSchema,
  SessionReadyEventSchema,
  SessionErrorEventSchema,
  SessionStoppedEventSchema,
  type StartSessionRequest,
  type StartSessionResponse,
  type StopSessionRequest,
  type SessionReadyEvent,
  type SessionErrorEvent,
  type SessionStoppedEvent,
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { z } from 'zod';
import { previewSessionManager } from '../preview/preview-session-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Preview Session IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register preview session IPC handlers.
 */
export function registerPreviewHandlers() {
  ipcMain.handle(
    'preview:startSession',
    validated(
      StartSessionRequestSchema,
      StartSessionResponseSchema,
      async (_event, request: StartSessionRequest): Promise<StartSessionResponse> => {
        console.log('[IPC] preview:startSession', request);
        const sessionId = await previewSessionManager.startSession(request.target);
        return { sessionId };
      }
    )
  );

  ipcMain.handle(
    'preview:stopSession',
    validated(
      StopSessionRequestSchema,
      z.void(),
      async (_event, request: StopSessionRequest): Promise<void> => {
        console.log('[IPC] preview:stopSession', request);
        await previewSessionManager.stopSession(request.sessionId);
      }
    )
  );
}

/**
 * Broadcast session ready event to all renderer windows.
 */
export function broadcastSessionReady(event: SessionReadyEvent) {
  const validated = validateEvent(
    SessionReadyEventSchema,
    event,
    'preview:sessionReady'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('preview:sessionReady', validated);
  });
}

/**
 * Broadcast session error event to all renderer windows.
 */
export function broadcastSessionError(event: SessionErrorEvent) {
  const validated = validateEvent(
    SessionErrorEventSchema,
    event,
    'preview:sessionError'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('preview:sessionError', validated);
  });
}

/**
 * Broadcast session stopped event to all renderer windows.
 */
export function broadcastSessionStopped(event: SessionStoppedEvent) {
  const validated = validateEvent(
    SessionStoppedEventSchema,
    event,
    'preview:sessionStopped'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('preview:sessionStopped', validated);
  });
}
