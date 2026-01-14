// ─────────────────────────────────────────────────────────────────────────────
// Override Store (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Authoritative override store in main process.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type {
  OverrideOp,
  PersistedOverride,
  PersistedOverridesFile,
  PreviewSessionId,
  PreviewSessionTarget,
  InstanceId,
  PropPath,
  JsonValue,
} from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Override Store Types
// ─────────────────────────────────────────────────────────────────────────────

interface OverrideKey {
  instanceId: InstanceId;
  path: PropPath;
}

interface StoredOverride {
  instanceId: InstanceId;
  path: PropPath;
  value: JsonValue;
  componentTypeId?: string;
  instanceLocator?: JsonValue;
}

interface SessionOverrides {
  sessionId: PreviewSessionId;
  target: PreviewSessionTarget;
  overrides: Map<string, StoredOverride>; // key = `${instanceId}:${path}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Override Store
// ─────────────────────────────────────────────────────────────────────────────

export class OverrideStore {
  private workspacePath: string | null = null;
  private sessionOverrides = new Map<PreviewSessionId, SessionOverrides>();
  private orphanedOverrides: StoredOverride[] = [];

  /**
   * Initialize the store for a workspace.
   */
  async init(workspacePath: string | null): Promise<void> {
    this.workspacePath = workspacePath;
    this.sessionOverrides.clear();
    this.orphanedOverrides = [];

    if (workspacePath) {
      await this.loadFromDisk();
    }
  }

  /**
   * Apply an override operation batch.
   */
  async applyOps(
    sessionId: PreviewSessionId,
    target: PreviewSessionTarget,
    ops: OverrideOp[]
  ): Promise<void> {
    console.log(`[OverrideStore] Applying ${ops.length} operation(s) for session ${sessionId}`);

    // Ensure session exists
    if (!this.sessionOverrides.has(sessionId)) {
      this.sessionOverrides.set(sessionId, {
        sessionId,
        target,
        overrides: new Map(),
      });
    }

    const sessionData = this.sessionOverrides.get(sessionId)!;

    // Apply each operation
    for (const op of ops) {
      this.applyOp(sessionData, op);
    }

    // Persist changes
    await this.persistToDisk();
  }

  /**
   * Get all overrides for a session.
   */
  getSessionOverrides(sessionId: PreviewSessionId): OverrideOp[] {
    const sessionData = this.sessionOverrides.get(sessionId);
    if (!sessionData) {
      return [];
    }

    const ops: OverrideOp[] = [];
    for (const override of sessionData.overrides.values()) {
      ops.push({
        op: 'set',
        instanceId: override.instanceId,
        path: override.path,
        value: override.value,
        componentTypeId: override.componentTypeId,
        instanceLocator: override.instanceLocator,
      });
    }

    return ops;
  }

  /**
   * Get all overrides across sessions.
   */
  getAllOverrides(): Array<{
    sessionId: PreviewSessionId;
    target: PreviewSessionTarget;
    override: StoredOverride;
  }> {
    const results: Array<{
      sessionId: PreviewSessionId;
      target: PreviewSessionTarget;
      override: StoredOverride;
    }> = [];

    for (const sessionData of this.sessionOverrides.values()) {
      for (const override of sessionData.overrides.values()) {
        results.push({
          sessionId: sessionData.sessionId,
          target: sessionData.target,
          override,
        });
      }
    }

    return results;
  }

  /**
   * Get orphaned overrides.
   */
  getOrphanedOverrides(): StoredOverride[] {
    return [...this.orphanedOverrides];
  }

  /**
   * Clear orphaned overrides.
   */
  async clearOrphanedOverrides(): Promise<void> {
    this.orphanedOverrides = [];
    await this.persistToDisk();
  }

  /**
   * Clear all overrides for a session.
   */
  async clearSession(sessionId: PreviewSessionId): Promise<void> {
    this.sessionOverrides.delete(sessionId);
    await this.persistToDisk();
  }

  /**
   * Apply a single override operation.
   */
  private applyOp(sessionData: SessionOverrides, op: OverrideOp): void {
    switch (op.op) {
      case 'set':
        this.setOverride(
          sessionData,
          op.instanceId!,
          op.path!,
          op.value!,
          op.componentTypeId,
          op.instanceLocator
        );
        break;

      case 'clear':
        this.clearOverride(sessionData, op.instanceId!, op.path!);
        break;

      case 'clearInstance':
        this.clearInstanceOverrides(sessionData, op.instanceId!);
        break;

      case 'clearAll':
        this.clearAllOverrides(sessionData);
        break;
    }
  }

  /**
   * Set an override.
   */
  private setOverride(
    sessionData: SessionOverrides,
    instanceId: InstanceId,
    path: PropPath,
    value: JsonValue,
    componentTypeId?: string,
    instanceLocator?: JsonValue
  ): void {
    const key = this.makeKey(instanceId, path);
    sessionData.overrides.set(key, {
      instanceId,
      path,
      value,
      componentTypeId,
      instanceLocator,
    });
    console.log(`[OverrideStore] Set override: ${key} =`, value);
  }

  /**
   * Clear a specific override.
   */
  private clearOverride(
    sessionData: SessionOverrides,
    instanceId: InstanceId,
    path: PropPath
  ): void {
    const key = this.makeKey(instanceId, path);
    sessionData.overrides.delete(key);
    console.log(`[OverrideStore] Cleared override: ${key}`);
  }

  /**
   * Clear all overrides for an instance.
   */
  private clearInstanceOverrides(sessionData: SessionOverrides, instanceId: InstanceId): void {
    const keysToDelete: string[] = [];
    for (const [key, override] of sessionData.overrides) {
      if (override.instanceId === instanceId) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      sessionData.overrides.delete(key);
    }

    console.log(`[OverrideStore] Cleared ${keysToDelete.length} override(s) for instance ${instanceId}`);
  }

  /**
   * Clear all overrides for the session.
   */
  private clearAllOverrides(sessionData: SessionOverrides): void {
    const count = sessionData.overrides.size;
    sessionData.overrides.clear();
    console.log(`[OverrideStore] Cleared all ${count} override(s)`);
  }

  /**
   * Make a unique key for an override.
   */
  private makeKey(instanceId: InstanceId, path: PropPath): string {
    return `${instanceId}:${path}`;
  }

  /**
   * Load overrides from disk.
   */
  private async loadFromDisk(): Promise<void> {
    if (!this.workspacePath) {
      return;
    }

    const filePath = this.getOverridesFilePath();
    if (!existsSync(filePath)) {
      console.log('[OverrideStore] No overrides file found, starting fresh');
      return;
    }

    try {
      const content = await readFile(filePath, 'utf-8');
      const data: PersistedOverridesFile = JSON.parse(content);

      console.log('[OverrideStore] Loading overrides from disk:', filePath);

      // Load app overrides
      if (data.app?.overrides) {
        // v0: Create a synthetic session for app overrides
        // In a real implementation, we'd need to match these to actual sessions
        // For now, we'll store them as orphaned until a session claims them
        for (const override of data.app.overrides) {
          this.orphanedOverrides.push(override);
        }
        console.log(`[OverrideStore] Loaded ${data.app.overrides.length} app override(s) as orphaned`);
      }

      // Load component overrides
      if (data.component?.overrides) {
        for (const override of data.component.overrides) {
          this.orphanedOverrides.push(override);
        }
        console.log(`[OverrideStore] Loaded ${data.component.overrides.length} component override(s) as orphaned`);
      }
    } catch (error) {
      console.error('[OverrideStore] Failed to load overrides:', error);
    }
  }

  /**
   * Persist overrides to disk transactionally.
   */
  private async persistToDisk(): Promise<void> {
    if (!this.workspacePath) {
      return;
    }

    const filePath = this.getOverridesFilePath();
    const dirPath = join(this.workspacePath, '.scaffa');

    try {
      // Ensure .scaffa directory exists
      if (!existsSync(dirPath)) {
        console.log(`[OverrideStore] Creating .scaffa directory: ${dirPath}`);
        await mkdir(dirPath, { recursive: true });
      }

      // Collect all overrides grouped by target type
      const appOverrides: PersistedOverride[] = [];
      const componentOverrides: PersistedOverride[] = [];

      for (const sessionData of this.sessionOverrides.values()) {
        const targetOverrides =
          sessionData.target.type === 'app' ? appOverrides : componentOverrides;

        for (const override of sessionData.overrides.values()) {
          targetOverrides.push({
            instanceId: override.instanceId as string,
            path: override.path as string,
            value: override.value,
            ...(override.componentTypeId
              ? { componentTypeId: override.componentTypeId }
              : null),
            ...(override.instanceLocator
              ? { instanceLocator: override.instanceLocator }
              : null),
          });
        }
      }

      // Sort for deterministic output
      const sortOverrides = (overrides: PersistedOverride[]) => {
        return overrides.sort((a, b) => {
          if (a.instanceId !== b.instanceId) {
            return a.instanceId.localeCompare(b.instanceId);
          }
          return a.path.localeCompare(b.path);
        });
      };

      const data: PersistedOverridesFile = {
        schemaVersion: 'v0',
        updatedAt: new Date().toISOString(),
      };

      if (appOverrides.length > 0) {
        data.app = {
          overrides: sortOverrides(appOverrides),
        };
      }

      if (componentOverrides.length > 0) {
        data.component = {
          overrides: sortOverrides(componentOverrides),
        };
      }

      // Write transactionally (write temp + rename)
      const tempPath = `${filePath}.tmp`;
      await writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

      // Atomic rename
      const { rename } = await import('node:fs/promises');
      await rename(tempPath, filePath);

      console.log('[OverrideStore] Persisted overrides to disk:', filePath);
    } catch (error) {
      // Enhanced error logging with actionable diagnostics
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[OverrideStore] Failed to persist overrides:', errorMessage);
      console.error('[OverrideStore] Workspace path:', this.workspacePath);
      console.error('[OverrideStore] Target file:', filePath);
      console.error('[OverrideStore] Target directory:', dirPath);

      // Provide actionable guidance based on error type
      if (errorMessage.includes('EACCES') || errorMessage.includes('EPERM')) {
        console.error('[OverrideStore] → Permission denied. Check write permissions for:', dirPath);
        console.error('[OverrideStore] → Try: chmod u+w', dirPath);
      } else if (errorMessage.includes('ENOENT')) {
        console.error('[OverrideStore] → Directory or path not found. Workspace path may be invalid.');
      } else if (errorMessage.includes('ENOSPC')) {
        console.error('[OverrideStore] → No space left on device. Free up disk space and retry.');
      } else if (errorMessage.includes('EROFS')) {
        console.error('[OverrideStore] → Read-only file system. Check mount options for:', this.workspacePath);
      }

      // Re-throw error so it surfaces to IPC handlers and UI
      throw new Error(
        `Failed to persist overrides to ${filePath}: ${errorMessage}. ` +
        `Check console logs for diagnostics.`
      );
    }
  }

  /**
   * Get the overrides file path.
   */
  private getOverridesFilePath(): string {
    return join(this.workspacePath!, '.scaffa', 'overrides.v0.json');
  }
}

// Singleton instance
export const overrideStore = new OverrideStore();
