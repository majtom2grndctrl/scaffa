import { contextBridge, ipcRenderer } from "electron";
import type {
  StartSessionRequest,
  StartSessionResponse,
  StopSessionRequest,
  GetLaunchersRequest,
  GetLaunchersResponse,
  SetPreviewViewportRequest,
  SetOverrideRequest,
  ClearOverrideRequest,
  ClearInstanceOverridesRequest,
  ClearAllOverridesRequest,
  SaveOverridesRequest,
  SaveOverridesResponse,
  GetGraphSnapshotRequest,
  GetGraphSnapshotResponse,
  SessionReadyEvent,
  SessionErrorEvent,
  SessionStoppedEvent,
  SelectionChangedEvent,
  OverridesChangedEvent,
  GraphPatch,
  SelectWorkspaceRequest,
  SelectWorkspaceResponse,
  GetWorkspaceRequest,
  GetWorkspaceResponse,
  WorkspaceChangedEvent,
  GetRecentWorkspacesRequest,
  GetRecentWorkspacesResponse,
  OpenRecentWorkspaceRequest,
  OpenRecentWorkspaceResponse,
  RemoveRecentWorkspaceRequest,
  RemoveRecentWorkspaceResponse,
  OpenDemoWorkspaceRequest,
  OpenDemoWorkspaceResponse,
} from "../shared/index.js";
import type {
  GetConfigRequest,
  GetConfigResponse,
} from "../main/ipc/config.js";
import type {
  GetRegistryRequest,
  GetRegistryResponse,
} from "../main/ipc/registry.js";
import type {
  GetInspectorSectionsRequest,
  GetInspectorSectionsResponse,
} from "../shared/ipc.js";

// ─────────────────────────────────────────────────────────────────────────────
// Preload: Typed window.skaffa APIs (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/skaffa_ipc_boundaries_and_sequences.md

/**
 * Typed callback handler for IPC events.
 */
type EventCallback<T> = (event: T) => void;

/**
 * Unsubscribe function returned by event listeners.
 */
type Unsubscribe = () => void;

const skaffaApi = {
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Workspace APIs
  // ───────────────────────────────────────────────────────────────────────────

  workspace: {
    select: (
      request: SelectWorkspaceRequest,
    ): Promise<SelectWorkspaceResponse> => {
      return ipcRenderer.invoke("workspace:select", request);
    },

    get: (request: GetWorkspaceRequest): Promise<GetWorkspaceResponse> => {
      return ipcRenderer.invoke("workspace:get", request);
    },

    getRecents: (
      request: GetRecentWorkspacesRequest,
    ): Promise<GetRecentWorkspacesResponse> => {
      return ipcRenderer.invoke("workspace:getRecents", request);
    },

    openRecent: (
      request: OpenRecentWorkspaceRequest,
    ): Promise<OpenRecentWorkspaceResponse> => {
      return ipcRenderer.invoke("workspace:openRecent", request);
    },

    removeRecent: (
      request: RemoveRecentWorkspaceRequest,
    ): Promise<RemoveRecentWorkspaceResponse> => {
      return ipcRenderer.invoke("workspace:removeRecent", request);
    },

    openDemo: (
      request: OpenDemoWorkspaceRequest,
    ): Promise<OpenDemoWorkspaceResponse> => {
      return ipcRenderer.invoke("workspace:openDemo", request);
    },

    onWorkspaceChanged: (
      callback: EventCallback<WorkspaceChangedEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: WorkspaceChangedEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("workspace:changed", listener);
      return () => {
        ipcRenderer.removeListener("workspace:changed", listener);
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Config APIs
  // ───────────────────────────────────────────────────────────────────────────

  config: {
    get: (request: GetConfigRequest): Promise<GetConfigResponse> => {
      return ipcRenderer.invoke("config:get", request);
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Registry APIs
  // ───────────────────────────────────────────────────────────────────────────

  registry: {
    get: (request: GetRegistryRequest): Promise<GetRegistryResponse> => {
      return ipcRenderer.invoke("registry:get", request);
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Preview APIs
  // ───────────────────────────────────────────────────────────────────────────

  preview: {
    startSession: (
      request: StartSessionRequest,
    ): Promise<StartSessionResponse> => {
      return ipcRenderer.invoke("preview:startSession", request);
    },

    stopSession: (request: StopSessionRequest): Promise<void> => {
      return ipcRenderer.invoke("preview:stopSession", request);
    },

    getLaunchers: (
      request: GetLaunchersRequest,
    ): Promise<GetLaunchersResponse> => {
      return ipcRenderer.invoke("preview:getLaunchers", request);
    },

    setViewport: (request: SetPreviewViewportRequest): Promise<void> => {
      return ipcRenderer.invoke("preview:setViewport", request);
    },

    onSessionReady: (
      callback: EventCallback<SessionReadyEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: SessionReadyEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("preview:sessionReady", listener);
      return () => {
        ipcRenderer.removeListener("preview:sessionReady", listener);
      };
    },

    onSessionError: (
      callback: EventCallback<SessionErrorEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: SessionErrorEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("preview:sessionError", listener);
      return () => {
        ipcRenderer.removeListener("preview:sessionError", listener);
      };
    },

    onSessionStopped: (
      callback: EventCallback<SessionStoppedEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: SessionStoppedEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("preview:sessionStopped", listener);
      return () => {
        ipcRenderer.removeListener("preview:sessionStopped", listener);
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Selection APIs
  // ───────────────────────────────────────────────────────────────────────────

  selection: {
    onSelectionChanged: (
      callback: EventCallback<SelectionChangedEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: SelectionChangedEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("selection:changed", listener);
      return () => {
        ipcRenderer.removeListener("selection:changed", listener);
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Override APIs
  // ───────────────────────────────────────────────────────────────────────────

  overrides: {
    set: (request: SetOverrideRequest): Promise<void> => {
      return ipcRenderer.invoke("overrides:set", request);
    },

    clear: (request: ClearOverrideRequest): Promise<void> => {
      return ipcRenderer.invoke("overrides:clear", request);
    },

    clearInstance: (request: ClearInstanceOverridesRequest): Promise<void> => {
      return ipcRenderer.invoke("overrides:clearInstance", request);
    },

    clearAll: (request: ClearAllOverridesRequest): Promise<void> => {
      return ipcRenderer.invoke("overrides:clearAll", request);
    },

    save: (request: SaveOverridesRequest): Promise<SaveOverridesResponse> => {
      return ipcRenderer.invoke("overrides:save", request);
    },

    onOverridesChanged: (
      callback: EventCallback<OverridesChangedEvent>,
    ): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: OverridesChangedEvent,
      ) => {
        callback(data);
      };
      ipcRenderer.on("overrides:changed", listener);
      return () => {
        ipcRenderer.removeListener("overrides:changed", listener);
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Graph APIs
  // ───────────────────────────────────────────────────────────────────────────

  graph: {
    getSnapshot: (
      request: GetGraphSnapshotRequest,
    ): Promise<GetGraphSnapshotResponse> => {
      return ipcRenderer.invoke("graph:getSnapshot", request);
    },

    onPatch: (callback: EventCallback<GraphPatch>): Unsubscribe => {
      const listener = (
        _event: Electron.IpcRendererEvent,
        data: GraphPatch,
      ) => {
        callback(data);
      };
      ipcRenderer.on("graph:patch", listener);
      return () => {
        ipcRenderer.removeListener("graph:patch", listener);
      };
    },
  },

  // ───────────────────────────────────────────────────────────────────────────
  // Inspector APIs
  // ───────────────────────────────────────────────────────────────────────────

  inspector: {
    getSections: (
      request: GetInspectorSectionsRequest,
    ): Promise<GetInspectorSectionsResponse> => {
      return ipcRenderer.invoke("inspector:getSections", request);
    },
  },
};

contextBridge.exposeInMainWorld("skaffa", skaffaApi);

// ─────────────────────────────────────────────────────────────────────────────
// Type Augmentation for window.skaffa
// ─────────────────────────────────────────────────────────────────────────────

export type SkaffaApi = typeof skaffaApi;

declare global {
  interface Window {
    skaffa: SkaffaApi;
  }
}
