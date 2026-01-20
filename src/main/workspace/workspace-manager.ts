import { app } from 'electron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { WorkspaceInfo } from '../../shared/index.js';
import { configManager } from '../config/config-manager.js';
import { overrideStore } from '../overrides/override-store.js';
import { projectGraphStore } from '../graph/graph-store.js';

// ─────────────────────────────────────────────────────────────────────────────
// Workspace Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages current workspace selection and persistence.

const WORKSPACE_STATE_FILE = 'workspace-state.json';
const MAX_RECENT_WORKSPACES = 8;

interface WorkspaceState {
  currentWorkspace: WorkspaceInfo | null;
  recentWorkspaces: WorkspaceInfo[];
}

class WorkspaceManager {
  private currentWorkspace: WorkspaceInfo | null = null;
  private recentWorkspaces: WorkspaceInfo[] = [];
  private stateFilePath: string;

  constructor() {
    this.stateFilePath = path.join(app.getPath('userData'), WORKSPACE_STATE_FILE);
  }

  /**
   * Load persisted workspace state from disk.
   */
  async load(options?: { skipRestore?: boolean }): Promise<void> {
    try {
      const data = await fs.readFile(this.stateFilePath, 'utf-8');
      const state: WorkspaceState = JSON.parse(data);

      if (options?.skipRestore) {
        console.log('[Workspace] Skipping restore of previous workspace (requested via flag)');
        this.currentWorkspace = null;
      } else {
        this.currentWorkspace = state.currentWorkspace;
      }

      this.recentWorkspaces = (state.recentWorkspaces ?? []).sort((a, b) =>
        (b.lastOpened ?? '').localeCompare(a.lastOpened ?? '')
      );
      console.log('[Workspace] Loaded workspace:', this.currentWorkspace?.path);
    } catch (error) {
      // File doesn't exist or is invalid - start fresh
      console.log('[Workspace] No persisted workspace found');
      this.currentWorkspace = null;
      this.recentWorkspaces = [];
    }

    // Load config for the current workspace
    await configManager.loadForWorkspace(this.currentWorkspace?.path ?? null, {
      notifyExtensionHost: false,
    });

    // Initialize override store for the current workspace
    await overrideStore.init(this.currentWorkspace?.path ?? null);

    // Reset project graph for the workspace
    projectGraphStore.reset();
  }

  /**
   * Save current workspace state to disk.
   */
  private async save(): Promise<void> {
    const state: WorkspaceState = {
      currentWorkspace: this.currentWorkspace,
      recentWorkspaces: this.recentWorkspaces,
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
   * Get recent workspaces (most recent first).
   */
  getRecentWorkspaces(): WorkspaceInfo[] {
    return [...this.recentWorkspaces];
  }

  /**
   * Remove a workspace from recents.
   */
  async removeRecentWorkspace(pathToRemove: string): Promise<void> {
    this.recentWorkspaces = this.recentWorkspaces.filter(
      (workspace) => workspace.path !== pathToRemove
    );
    await this.save();
  }

  /**
   * Set the current workspace and persist it.
   */
  async setCurrentWorkspace(workspace: WorkspaceInfo | null): Promise<void> {
    if (workspace) {
      const updated = this.addRecentWorkspace(workspace);
      this.currentWorkspace = updated;
    } else {
      this.currentWorkspace = null;
    }
    await this.save();
    console.log('[Workspace] Workspace changed:', workspace?.path);

    // Load config for the new workspace (don't notify via config manager,
    // we'll restart the extension host directly with the new workspace)
    await configManager.loadForWorkspace(workspace?.path ?? null, {
      notifyExtensionHost: false,
    });

    // Initialize override store for the new workspace
    await overrideStore.init(workspace?.path ?? null);

    // Reset project graph for the new workspace
    projectGraphStore.reset();

    // Restart extension host with new workspace and config
    // This ensures modules are loaded and registry contributions are sent
    const { extensionHostManager } = await import('../extension-host/extension-host-manager.js');
    const newConfig = configManager.getCurrentConfig();
    console.log('[Workspace] Restarting extension host for new workspace...');
    await extensionHostManager.restart(workspace?.path ?? null, newConfig);
    console.log('[Workspace] Extension host restarted');
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

  /**
   * Add or update a workspace in recents.
   */
  private addRecentWorkspace(workspace: WorkspaceInfo): WorkspaceInfo {
    const updated: WorkspaceInfo = {
      ...workspace,
      lastOpened: new Date().toISOString(),
    };

    this.recentWorkspaces = [
      updated,
      ...this.recentWorkspaces.filter((entry) => entry.path !== workspace.path),
    ].slice(0, MAX_RECENT_WORKSPACES);

    return updated;
  }
}

// Singleton instance
export const workspaceManager = new WorkspaceManager();
