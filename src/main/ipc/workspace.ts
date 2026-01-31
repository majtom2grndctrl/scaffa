import { ipcMain, dialog, BrowserWindow, app } from "electron";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import {
  SelectWorkspaceRequestSchema,
  SelectWorkspaceResponseSchema,
  GetWorkspaceRequestSchema,
  GetWorkspaceResponseSchema,
  WorkspaceChangedEventSchema,
  GetRecentWorkspacesRequestSchema,
  GetRecentWorkspacesResponseSchema,
  OpenRecentWorkspaceRequestSchema,
  OpenRecentWorkspaceResponseSchema,
  RemoveRecentWorkspaceRequestSchema,
  RemoveRecentWorkspaceResponseSchema,
  OpenDemoWorkspaceRequestSchema,
  OpenDemoWorkspaceResponseSchema,
  type SelectWorkspaceRequest,
  type SelectWorkspaceResponse,
  type GetWorkspaceRequest,
  type GetWorkspaceResponse,
  type WorkspaceChangedEvent,
  type GetRecentWorkspacesRequest,
  type GetRecentWorkspacesResponse,
  type OpenRecentWorkspaceRequest,
  type OpenRecentWorkspaceResponse,
  type RemoveRecentWorkspaceRequest,
  type RemoveRecentWorkspaceResponse,
  type OpenDemoWorkspaceRequest,
  type OpenDemoWorkspaceResponse,
  type WorkspaceOpenError,
} from "../../shared/index.js";
import { validated, validateEvent } from "./validation.js";
import { workspaceManager } from "../workspace/workspace-manager.js";
import { loadConfig } from "../config/config-loader.js";
import { configManager } from "../config/config-manager.js";
import { extensionHostManager } from "../extension-host/extension-host-manager.js";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register workspace IPC handlers.
 */
export function registerWorkspaceHandlers() {
  ipcMain.handle(
    "workspace:select",
    validated(
      SelectWorkspaceRequestSchema,
      SelectWorkspaceResponseSchema,
      async (
        _event,
        _request: SelectWorkspaceRequest,
      ): Promise<SelectWorkspaceResponse> => {
        console.log("[IPC] workspace:select");

        // Show native folder chooser dialog
        const result = await dialog.showOpenDialog({
          properties: ["openDirectory"],
          title: "Select Workspace Folder",
          buttonLabel: "Select Workspace",
        });

        if (result.canceled || result.filePaths.length === 0) {
          return { workspace: null, error: null };
        }

        const folderPath = result.filePaths[0];
        return openWorkspacePath(folderPath);
      },
    ),
  );

  ipcMain.handle(
    "workspace:get",
    validated(
      GetWorkspaceRequestSchema,
      GetWorkspaceResponseSchema,
      async (
        _event,
        _request: GetWorkspaceRequest,
      ): Promise<GetWorkspaceResponse> => {
        console.log("[IPC] workspace:get");
        const workspace = workspaceManager.getCurrentWorkspace();
        return { workspace };
      },
    ),
  );

  ipcMain.handle(
    "workspace:getRecents",
    validated(
      GetRecentWorkspacesRequestSchema,
      GetRecentWorkspacesResponseSchema,
      async (
        _event,
        _request: GetRecentWorkspacesRequest,
      ): Promise<GetRecentWorkspacesResponse> => {
        console.log("[IPC] workspace:getRecents");
        return { recents: workspaceManager.getRecentWorkspaces() };
      },
    ),
  );

  ipcMain.handle(
    "workspace:openRecent",
    validated(
      OpenRecentWorkspaceRequestSchema,
      OpenRecentWorkspaceResponseSchema,
      async (
        _event,
        request: OpenRecentWorkspaceRequest,
      ): Promise<OpenRecentWorkspaceResponse> => {
        console.log("[IPC] workspace:openRecent", request.path);
        return openWorkspacePath(request.path);
      },
    ),
  );

  ipcMain.handle(
    "workspace:removeRecent",
    validated(
      RemoveRecentWorkspaceRequestSchema,
      RemoveRecentWorkspaceResponseSchema,
      async (
        _event,
        request: RemoveRecentWorkspaceRequest,
      ): Promise<RemoveRecentWorkspaceResponse> => {
        console.log("[IPC] workspace:removeRecent", request.path);
        await workspaceManager.removeRecentWorkspace(request.path);
        return { recents: workspaceManager.getRecentWorkspaces() };
      },
    ),
  );

  ipcMain.handle(
    "workspace:openDemo",
    validated(
      OpenDemoWorkspaceRequestSchema,
      OpenDemoWorkspaceResponseSchema,
      async (
        _event,
        _request: OpenDemoWorkspaceRequest,
      ): Promise<OpenDemoWorkspaceResponse> => {
        console.log("[IPC] workspace:openDemo");
        const demoPath = path.resolve(app.getAppPath(), "demo");
        const stats = await safeStat(demoPath);
        if (!stats || !stats.isDirectory()) {
          return {
            workspace: null,
            error: {
              code: "DEMO_NOT_FOUND",
              message: `Demo workspace not found at ${demoPath}`,
              details: { path: demoPath },
            },
          };
        }
        return openWorkspacePath(demoPath);
      },
    ),
  );
}

async function safeStat(
  targetPath: string,
): Promise<Awaited<ReturnType<typeof fs.stat>> | null> {
  try {
    return await fs.stat(targetPath);
  } catch {
    return null;
  }
}

async function openWorkspacePath(folderPath: string): Promise<{
  workspace: SelectWorkspaceResponse["workspace"];
  error: WorkspaceOpenError | null;
}> {
  const stats = await safeStat(folderPath);
  if (!stats) {
    return {
      workspace: null,
      error: {
        code: "NOT_FOUND",
        message: `Workspace folder not found: ${folderPath}`,
        details: { path: folderPath },
      },
    };
  }

  if (!stats.isDirectory()) {
    return {
      workspace: null,
      error: {
        code: "NOT_A_DIRECTORY",
        message: `Selected path is not a folder: ${folderPath}`,
        details: { path: folderPath },
      },
    };
  }

  const loadResult = await loadConfig(folderPath);
  if (!loadResult.success) {
    const errorMessage =
      loadResult.error?.code === "NOT_FOUND"
        ? `No skaffa.config.js found in ${folderPath}`
        : (loadResult.error?.message ?? "Failed to load skaffa.config.js");
    return {
      workspace: null,
      error: {
        code: loadResult.error?.code ?? "UNKNOWN_ERROR",
        message: errorMessage,
        details: {
          path: folderPath,
          configError: loadResult.error?.details,
        },
      },
    };
  }

  const workspace = workspaceManager.createWorkspaceInfo(folderPath);

  // Set as current workspace and persist
  await workspaceManager.setCurrentWorkspace(workspace);

  const currentWorkspace = workspaceManager.getCurrentWorkspace();

  // Restart extension host with new workspace + config
  await extensionHostManager.restart(
    currentWorkspace?.path ?? null,
    configManager.getCurrentConfig(),
  );

  // Broadcast workspace changed event
  broadcastWorkspaceChanged({ workspace: currentWorkspace });

  return { workspace: currentWorkspace, error: null };
}

/**
 * Broadcast workspace changed event to all renderer windows.
 */
export function broadcastWorkspaceChanged(event: WorkspaceChangedEvent) {
  const validated = validateEvent(
    WorkspaceChangedEventSchema,
    event,
    "workspace:changed",
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("workspace:changed", validated);
  });
}
