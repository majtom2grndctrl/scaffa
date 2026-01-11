import { app } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { WorkspaceInfo } from '../../shared/index.js';
import { configManager } from '../config/config-manager.js';
import { overrideStore } from '../overrides/override-store.js';

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages current workspace selection and persistence.

const WORKSPACE_STATE_FILE = 'workspace-state.json';

interface WorkspaceState {
  currentWorkspace: WorkspaceInfo | null;
}

class WorkspaceManager {
  private currentWorkspace: WorkspaceInfo | null = null;
  private stateFilePath: string;

  constructor() {
    this.stateFilePath = path.join(app.getPath('userData'), WORKSPACE_STATE_FILE);
  }

  /**
   * Load persisted workspace state from disk.
   */
  async load(): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const state: WorkspaceState = JSON.parse(data);
      this.currentWorkspace = state.currentWorkspace;
      console.log('[Workspace] Loaded workspace:', this.currentWorkspace?.path);
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
      console.log('[Workspace] No persisted workspace found');
      this.currentWorkspace = null;
    }

    // Load config for the current workspace
    await configManager.loadForWorkspace(this.currentWorkspace?.path ?? null);

    // Initialize override store for the current workspace
    await overrideStore.init(this.currentWorkspace?.path ?? null);
  }

  /**
   * Save current workspace state to disk.
   */
  private async save(): Promise<void> {
    const state: WorkspaceState = {
      currentWorkspace: this.currentWorkspace,
    };
    await fs.writeFile(this.stateFilePath, JSON.stringify(state, null, 2), 'utf-8');
  }

  /**
   * Get the current workspace.
   */
  getCurrentWorkspace(): WorkspaceInfo | null {
    return this.currentWorkspace;
  }

  /**
   * Set the current workspace and persist it.
   */
  async setCurrentWorkspace(workspace: WorkspaceInfo | null): Promise<void> {
    this.currentWorkspace = workspace;
    await this.save();
    console.log('[Workspace] Workspace changed:', workspace?.path);

    // Load config for the new workspace
    await configManager.loadForWorkspace(workspace?.path ?? null);

    // Initialize override store for the new workspace
    await overrideStore.init(workspace?.path ?? null);
  }

  /**
   * Create workspace info from a folder path.
   */
  createWorkspaceInfo(folderPath: string): WorkspaceInfo {
    return {
      path: folderPath as any, // Cast to branded type
      name: path.basename(folderPath),
      lastOpened: new Date().toISOString(),
    };
  }
}

// Singleton instance
export const workspaceManager = new WorkspaceManager();
