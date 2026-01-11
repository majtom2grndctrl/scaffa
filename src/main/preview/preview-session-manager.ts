// ─────────────────────────────────────────────────────────────────────────────
// Preview Session Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages preview session lifecycle and coordinates with override store.

import { randomBytes } from 'node:crypto';
import type {
  PreviewSessionId,
  PreviewSessionTarget,
  PreviewSessionState,
  InstanceDescriptor,
} from '../../shared/index.js';
import type { AdapterId, RuntimeCapabilities } from '../../shared/index.js';
import type { OverrideOp } from '../../shared/index.js';
import { PreviewSession, type PreviewSessionEventHandlers } from './preview-session.js';
import {
  broadcastSessionReady,
  broadcastSessionError,
  broadcastSessionStopped,
} from '../ipc/preview.js';
import { overrideStore } from '../overrides/override-store.js';
import { launcherRegistry } from './launcher-registry.js';

// ─────────────────────────────────────────────────────────────────────────────
// Preview Session Manager
// ─────────────────────────────────────────────────────────────────────────────

class PreviewSessionManager {
  private sessions = new Map<PreviewSessionId, PreviewSession>();
  private currentSelection: {
    sessionId: PreviewSessionId;
    selected: InstanceDescriptor | null;
  } | null = null;

  /**
   * Start a new preview session.
   */
  async startSession(target: PreviewSessionTarget): Promise<PreviewSessionId> {
    const sessionId = this.generateSessionId();
    console.log(`[SessionManager] Starting session ${sessionId} for target:`, target);

    // Handle managed sessions (via launcher)
    let resolvedTarget = target;
    if (target.type === 'app' && target.launcherId) {
      console.log(`[SessionManager] Starting managed session via launcher: ${target.launcherId}`);
      try {
        const launchResult = await launcherRegistry.startLauncher(
          target.launcherId,
          target.launcherOptions ?? {}
        );

        // Replace target with resolved URL
        resolvedTarget = {
          type: 'app',
          url: launchResult.url,
        };

        console.log(`[SessionManager] Launcher started, resolved URL: ${launchResult.url}`);
      } catch (error) {
        console.error(`[SessionManager] Failed to start launcher ${target.launcherId}:`, error);
        throw error;
      }
    }

    // Create session
    const session = new PreviewSession(sessionId, resolvedTarget, this.createEventHandlers());
    this.sessions.set(sessionId, session);

    // Start the session (create WebContents and load URL)
    await session.start();

    return sessionId;
  }

  /**
   * Stop a preview session.
   */
  async stopSession(sessionId: PreviewSessionId): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] Session ${sessionId} not found`);
      return;
    }

    console.log(`[SessionManager] Stopping session ${sessionId}`);
    await session.stop();
    this.sessions.delete(sessionId);

    // Clear selection if it was for this session
    if (this.currentSelection?.sessionId === sessionId) {
      this.currentSelection = null;
    }

    // Broadcast stopped event
    broadcastSessionStopped({ sessionId });
  }

  /**
   * Get a session by ID.
   */
  getSession(sessionId: PreviewSessionId): PreviewSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions.
   */
  getAllSessions(): PreviewSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get current selection.
   */
  getCurrentSelection(): {
    sessionId: PreviewSessionId;
    selected: InstanceDescriptor | null;
  } | null {
    return this.currentSelection;
  }

  /**
   * Apply overrides to a session.
   */
  applyOverrides(sessionId: PreviewSessionId, ops: OverrideOp[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(`[SessionManager] Cannot apply overrides: session ${sessionId} not found`);
      return;
    }

    session.applyOverrides(ops);
  }

  /**
   * Send initial overrides to a session (called after runtime.ready).
   */
  sendInitialOverrides(sessionId: PreviewSessionId, initialOverrides: OverrideOp[]): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.warn(
        `[SessionManager] Cannot send initial overrides: session ${sessionId} not found`
      );
      return;
    }

    // Send host.init command with sessionId and initial overrides
    session.sendToRuntime({
      type: 'host.init',
      sessionId,
      initialOverrides,
    });
  }

  /**
   * Stop all sessions (cleanup on app quit).
   */
  async stopAllSessions(): Promise<void> {
    console.log('[SessionManager] Stopping all sessions');
    const stopPromises = Array.from(this.sessions.keys()).map((sessionId) =>
      this.stopSession(sessionId)
    );
    await Promise.all(stopPromises);
  }

  /**
   * Create event handlers for a session.
   */
  private createEventHandlers(): PreviewSessionEventHandlers {
    return {
      onStateChange: (sessionId, state) => {
        this.handleSessionStateChange(sessionId, state);
      },
      onError: (sessionId, error) => {
        this.handleSessionError(sessionId, error);
      },
      onRuntimeReady: (sessionId, adapterId, adapterVersion, capabilities) => {
        this.handleRuntimeReady(sessionId, adapterId, adapterVersion, capabilities);
      },
      onSelectionChanged: (sessionId, selected) => {
        this.handleSelectionChanged(sessionId, selected);
      },
    };
  }

  /**
   * Handle session state change.
   */
  private handleSessionStateChange(
    sessionId: PreviewSessionId,
    state: PreviewSessionState
  ): void {
    console.log(`[SessionManager] Session ${sessionId} state: ${state}`);

    // v0: State changes are logged; future versions may persist or broadcast more granularly
  }

  /**
   * Handle session error.
   */
  private handleSessionError(sessionId: PreviewSessionId, error: Error): void {
    console.error(`[SessionManager] Session ${sessionId} error:`, error);
    broadcastSessionError({
      sessionId,
      error: error.message,
    });
  }

  /**
   * Handle runtime.ready event.
   */
  private handleRuntimeReady(
    sessionId: PreviewSessionId,
    adapterId: AdapterId,
    adapterVersion: string,
    capabilities: RuntimeCapabilities
  ): void {
    console.log(
      `[SessionManager] Runtime ready for session ${sessionId}: ${adapterId}@${adapterVersion}`,
      capabilities
    );

    // Get the session target type
    const session = this.sessions.get(sessionId);
    if (!session) {
      console.error(`[SessionManager] Session ${sessionId} not found on runtime ready`);
      return;
    }

    // Broadcast session ready event
    broadcastSessionReady({
      sessionId,
      type: session.target.type,
    });

    // Send host.init with initial overrides from the override store
    const initialOverrides = overrideStore.getSessionOverrides(sessionId);
    this.sendInitialOverrides(sessionId, initialOverrides);
  }

  /**
   * Handle selection changed event.
   */
  private handleSelectionChanged(
    sessionId: PreviewSessionId,
    selected: InstanceDescriptor | null
  ): void {
    console.log(`[SessionManager] Selection changed for session ${sessionId}:`, selected);

    // Update current selection
    this.currentSelection = {
      sessionId,
      selected,
    };

    // TODO: Broadcast selection to renderer (will be implemented with selection IPC)
    // broadcastSelectionChanged({ sessionId, selected });
  }

  /**
   * Generate a unique session ID.
   */
  private generateSessionId(): PreviewSessionId {
    return `session_${randomBytes(16).toString('hex')}` as PreviewSessionId;
  }
}

// Singleton instance
export const previewSessionManager = new PreviewSessionManager();
