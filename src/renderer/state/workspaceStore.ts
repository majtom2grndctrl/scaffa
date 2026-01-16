import { create } from 'zustand';
import type {
  WorkspaceInfo,
  WorkspaceOpenError,
  WorkspacePath,
} from '../../shared/index.js';
import { useSessionStore } from './sessionStore';

interface WorkspaceState {
  currentWorkspace: WorkspaceInfo | null;
  // New: Workspace that is open in backend but pending configuration in frontend
  stagingWorkspace: WorkspaceInfo | null;
  // New: Flag to indicate we are in the middle of a pick flow
  isPicking: boolean;
  
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
  
  pickWorkspace: () => Promise<WorkspaceInfo | null>;
  pickRecent: (path: WorkspacePath) => Promise<WorkspaceInfo | null>;
  pickDemo: () => Promise<WorkspaceInfo | null>;
  activateWorkspace: () => void;
  cancelPick: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  currentWorkspace: null,
  stagingWorkspace: null,
  isPicking: false,
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
        const state = get();
        // If we are manually picking, trap the event in staging
        if (state.isPicking) {
          console.log('[WorkspaceStore] Trapping workspace change in staging:', event.workspace?.name);
          set({ stagingWorkspace: event.workspace });
        } else {
          // Normal flow (e.g. open recent, or external change)
          set({ currentWorkspace: event.workspace });
        }
        await state.refreshRecents();
      });
    } catch (error) {
      console.error('[WorkspaceStore] Failed to initialize:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  selectWorkspace: async () => {
    await runWorkspaceOpen(async () => window.scaffa.workspace.select({}), set, get);
  },

  pickWorkspace: async () => {
    set({ isLoading: true, error: null, isPicking: true, stagingWorkspace: null });
    try {
      const response = await window.scaffa.workspace.select({});
      
      if (response.error) {
        set({ error: response.error, isLoading: false, isPicking: false });
        return null;
      }
      
      // We don't turn off isPicking here; we wait for activateWorkspace or cancelPick
      // The onWorkspaceChanged event will fire and populate stagingWorkspace
      set({ isLoading: false });
      return response.workspace;
    } catch (error) {
      console.error('[WorkspaceStore] Pick workspace failed:', error);
      set({
        isLoading: false,
        isPicking: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pick workspace',
        },
      });
      return null;
    }
  },

  pickRecent: async (path) => {
    set({ isLoading: true, error: null, isPicking: true, stagingWorkspace: null });
    try {
      const response = await window.scaffa.workspace.openRecent({ path });

      if (response.error) {
        set({ error: response.error, isLoading: false, isPicking: false });
        return null;
      }

      set({ isLoading: false });
      return response.workspace;
    } catch (error) {
      console.error('[WorkspaceStore] Pick recent failed:', error);
      set({
        isLoading: false,
        isPicking: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pick recent',
        },
      });
      return null;
    }
  },

  pickDemo: async () => {
    set({ isLoading: true, error: null, isPicking: true, stagingWorkspace: null });
    try {
      const response = await window.scaffa.workspace.openDemo({});

      if (response.error) {
        set({ error: response.error, isLoading: false, isPicking: false });
        return null;
      }

      set({ isLoading: false });
      return response.workspace;
    } catch (error) {
      console.error('[WorkspaceStore] Pick demo failed:', error);
      set({
        isLoading: false,
        isPicking: false,
        error: {
          code: 'UNKNOWN_ERROR',
          message: error instanceof Error ? error.message : 'Failed to pick demo',
        },
      });
      return null;
    }
  },

  activateWorkspace: () => {
    const { stagingWorkspace } = get();
    if (stagingWorkspace) {
      console.log('[WorkspaceStore] Activating staging workspace:', stagingWorkspace.name);
      set({ 
        currentWorkspace: stagingWorkspace, 
        stagingWorkspace: null, 
        isPicking: false 
      });
    } else {
      console.warn('[WorkspaceStore] Activate called but no staging workspace found');
      set({ isPicking: false });
    }
  },

  cancelPick: () => {
    console.log('[WorkspaceStore] Cancelling pick');
    set({ stagingWorkspace: null, isPicking: false });
    // TODO: Ideally tell backend to close workspace?
  },

  openRecent: async (path) => {
    // Open Recent goes through the "fast path" (no staging)
    await runWorkspaceOpen(
      async () => window.scaffa.workspace.openRecent({ path }),
      set,
      get
    );
  },

  openDemo: async () => {
    useSessionStore.getState().setAutoStartTarget({
      type: 'app',
      launcherId: 'vite-launcher',
    });
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
  set({ isLoading: true, isPicking: false }); // Ensure we are NOT picking
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
  } finally {
    set({ isLoading: false });
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
