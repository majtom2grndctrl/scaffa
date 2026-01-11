import { ipcMain, dialog, BrowserWindow } from 'electron';
import {
  SelectWorkspaceRequestSchema,
  SelectWorkspaceResponseSchema,
  GetWorkspaceRequestSchema,
  GetWorkspaceResponseSchema,
  WorkspaceChangedEventSchema,
  type SelectWorkspaceRequest,
  type SelectWorkspaceResponse,
  type GetWorkspaceRequest,
  type GetWorkspaceResponse,
  type WorkspaceChangedEvent,
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { workspaceManager } from '../workspace/workspace-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Workspace IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register workspace IPC handlers.
 */
export function registerWorkspaceHandlers() {
  ipcMain.handle(
    'workspace:select',
    validated(
      SelectWorkspaceRequestSchema,
      SelectWorkspaceResponseSchema,
      async (_event, _request: SelectWorkspaceRequest): Promise<SelectWorkspaceResponse> => {
        console.log('[IPC] workspace:select');

        // Show native folder chooser dialog
        const result = await dialog.showOpenDialog({
          properties: ['openDirectory'],
          title: 'Select Workspace Folder',
          buttonLabel: 'Select Workspace',
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { workspace: null };
        }

        const folderPath = result.filePaths[0];
        const workspace = workspaceManager.createWorkspaceInfo(folderPath);

        // Set as current workspace and persist
        await workspaceManager.setCurrentWorkspace(workspace);

        // Broadcast workspace changed event
        broadcastWorkspaceChanged({ workspace });

        return { workspace };
      }
    )
  );

  ipcMain.handle(
    'workspace:get',
    validated(
      GetWorkspaceRequestSchema,
      GetWorkspaceResponseSchema,
      async (_event, _request: GetWorkspaceRequest): Promise<GetWorkspaceResponse> => {
        console.log('[IPC] workspace:get');
        const workspace = workspaceManager.getCurrentWorkspace();
        return { workspace };
      }
    )
  );
}

/**
 * Broadcast workspace changed event to all renderer windows.
 */
export function broadcastWorkspaceChanged(event: WorkspaceChangedEvent) {
  const validated = validateEvent(
    WorkspaceChangedEventSchema,
    event,
    'workspace:changed'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('workspace:changed', validated);
  });
}
