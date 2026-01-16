import { create } from 'zustand';
import type {
  PreviewSessionId,
  PreviewSessionType,
  PreviewSessionTarget,
  SessionReadyEvent,
  SessionErrorEvent,
  SessionStoppedEvent,
} from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Session State
// ─────────────────────────────────────────────────────────────────────────────

export interface PreviewSession {
  sessionId: PreviewSessionId;
  type: PreviewSessionType;
  state: 'creating' | 'ready' | 'error' | 'stopped';
  error?: string;
}

interface SessionStore {
  /**
   * Active preview sessions.
   */
  sessions: PreviewSession[];

  /**
   * Pending session target to auto-start when Workbench loads.
   */
  autoStartTarget: PreviewSessionTarget | null;

  /**
   * Add a new session (called when starting a session).
   */
  addSession: (sessionId: PreviewSessionId, type: PreviewSessionType) => void;

  /**
   * Set the target for auto-starting a session.
   */
  setAutoStartTarget: (target: PreviewSessionTarget | null) => void;

  /**
   * Mark a session as ready.
   */
  markSessionReady: (event: SessionReadyEvent) => void;

  /**
   * Mark a session as error.
   */
  markSessionError: (event: SessionErrorEvent) => void;

  /**
   * Remove a session.
   */
  removeSession: (event: SessionStoppedEvent) => void;

  /**
   * Get a session by ID.
   */
  getSession: (sessionId: PreviewSessionId) => PreviewSession | undefined;

  /**
   * Reset all sessions (e.g., on workspace change).
   */
  reset: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Store
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  autoStartTarget: null,

  addSession: (sessionId, type) => {
    set((state) => ({
      sessions: [
        ...state.sessions,
        {
          sessionId,
          type,
          state: 'creating',
        },
      ],
    }));
  },

  setAutoStartTarget: (target) => {
    set({ autoStartTarget: target });
  },

  markSessionReady: (event) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.sessionId === event.sessionId
          ? { ...session, type: event.type, state: 'ready' }
          : session
      ),
    }));
  },

  markSessionError: (event) => {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.sessionId === event.sessionId
          ? { ...session, state: 'error', error: event.error }
          : session
      ),
    }));
  },

  removeSession: (event) => {
    set((state) => ({
      sessions: state.sessions.filter((session) => session.sessionId !== event.sessionId),
    }));
  },

  getSession: (sessionId) => {
    return get().sessions.find((session) => session.sessionId === sessionId);
  },

  reset: () => {
    set({ sessions: [], autoStartTarget: null });
  },
}));

// ─────────────────────────────────────────────────────────────────────────────
// Session Event Listeners
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize session event listeners.
 * Call this once at app startup.
 */
export function initializeSessionListeners() {
  // Listen for session ready
  window.scaffa.preview.onSessionReady((event) => {
    console.log('[SessionStore] Session ready:', event);
    useSessionStore.getState().markSessionReady(event);
  });

  // Listen for session errors
  window.scaffa.preview.onSessionError((event) => {
    console.error('[SessionStore] Session error:', event);
    useSessionStore.getState().markSessionError(event);
  });

  // Listen for session stopped
  window.scaffa.preview.onSessionStopped((event) => {
    console.log('[SessionStore] Session stopped:', event);
    useSessionStore.getState().removeSession(event);
  });
}