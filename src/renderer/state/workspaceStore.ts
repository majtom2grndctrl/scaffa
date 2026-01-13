import { create } from 'zustand';
import type {
  WorkspaceInfo,
  WorkspaceOpenError,
  WorkspacePath,
} from '../../shared/index.js';

interface WorkspaceState {
  currentWorkspace: WorkspaceInfo | null;
  recents: WorkspaceInfo[];
  isLoading: boolean;
  error: WorkspaceOpenError | null;
  isInitialized: boolean;

  initialize: () => Promise<void>;
  selectWorkspace: () => Promise<void>;
  openRecent: (path: WorkspacePath) => Promise<void>;
  openDemo: () => Promise<void>;
  removeRecent: (path: WorkspacePath) => Promise<void>;
  refreshRecents: () => Promise<void>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  recents: [],
  isLoading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    set({ isLoading: true });

    try {
      const [workspaceResponse, recentsResponse] = await Promise.all([
        window.scaffa.workspace.get({}),
        window.scaffa.workspace.getRecents({}),
      ]);

      set({
        currentWorkspace: workspaceResponse.workspace,
        recents: recentsResponse.recents,
        isLoading: false,
        isInitialized: true,
      });

      window.scaffa.workspace.onWorkspaceChanged(async (event) => {
        set({ currentWorkspace: event.workspace });
        await get().refreshRecents();
      });
    } catch (error) {
      console.error('[WorkspaceStore] Failed to initialize:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  selectWorkspace: async () => {
    await runWorkspaceOpen(async () => window.scaffa.workspace.select({}), set, get);
  },

  openRecent: async (path) => {
    await runWorkspaceOpen(
      async () => window.scaffa.workspace.openRecent({ path }),
      set,
      get
    );
  },

  openDemo: async () => {
    await runWorkspaceOpen(async () => window.scaffa.workspace.openDemo({}), set, get);
  },

  removeRecent: async (path) => {
    try {
      const response = await window.scaffa.workspace.removeRecent({ path });
      set({ recents: response.recents });
    } catch (error) {
      console.error('[WorkspaceStore] Failed to remove recent:', error);
      set({
        error: {
          code: 'UNKNOWN_ERROR',
          message:
            error instanceof Error ? error.message : 'Failed to remove recent',
        },
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  refreshRecents: async () => {
    try {
      const response = await window.scaffa.workspace.getRecents({});
      set({ recents: response.recents });
    } catch (error) {
      console.error('[WorkspaceStore] Failed to refresh recents:', error);
    }
  },
}));

async function runWorkspaceOpen(
  action: () => Promise<{ workspace: WorkspaceInfo | null; error: WorkspaceOpenError | null }>,
  set: (partial: Partial<WorkspaceState>) => void,
  get: () => WorkspaceState
): Promise<void> {
  try {
    const response = await action();
    await handleOpenResult(response, set, get);
  } catch (error) {
    console.error('[WorkspaceStore] Workspace open failed:', error);
    set({
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Failed to open workspace',
      },
    });
  }
}

async function handleOpenResult(
  response: { workspace: WorkspaceInfo | null; error: WorkspaceOpenError | null },
  set: (partial: Partial<WorkspaceState>) => void,
  get: () => WorkspaceState
): Promise<void> {
  if (response.workspace) {
    set({ currentWorkspace: response.workspace });
    await get().refreshRecents();
  }

  set({ error: response.error ?? null });
}
