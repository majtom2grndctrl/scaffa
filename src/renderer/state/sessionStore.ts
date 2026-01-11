import { create } from 'zustand';
import type {
  PreviewSessionId,
  PreviewSessionType,
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
   * Add a new session (called when starting a session).
   */
  addSession: (sessionId: PreviewSessionId, type: PreviewSessionType) => void;

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
}

// ─────────────────────────────────────────────────────────────────────────────
// Session Store
// ─────────────────────────────────────────────────────────────────────────────

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],

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
