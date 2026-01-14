import { ipcMain, BrowserWindow } from 'electron';
import {
  SetOverrideRequestSchema,
  ClearOverrideRequestSchema,
  ClearInstanceOverridesRequestSchema,
  ClearAllOverridesRequestSchema,
  SaveOverridesRequestSchema,
  SaveOverridesResponseSchema,
  OverridesChangedEventSchema,
  type SaveOverridesRequest,
  type SaveOverridesResponse,
  type SetOverrideRequest,
  type ClearOverrideRequest,
  type ClearInstanceOverridesRequest,
  type ClearAllOverridesRequest,
  type OverridesChangedEvent,
  type OverrideOp,
  type DraftOverride,
  type SaveFailure,
} from '../../shared/index.js';
import { validated, validateEvent } from './validation.js';
import { z } from 'zod';
import { overrideStore } from '../overrides/override-store.js';
import { previewSessionManager } from '../preview/preview-session-manager.js';
import { extensionHostManager } from '../extension-host/extension-host-manager.js';
import { applyWorkspaceEdits } from '../workspace/workspace-edits.js';
import { workspaceManager } from '../workspace/workspace-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Override IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register override IPC handlers.
 */
export function registerOverrideHandlers() {
  ipcMain.handle(
    'overrides:set',
    validated(
      SetOverrideRequestSchema,
      z.void(),
      async (_event, request: SetOverrideRequest): Promise<void> => {
        console.log('[IPC] overrides:set', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'set',
            instanceId: request.instanceId,
            path: request.path,
            value: request.value,
            componentTypeId: request.componentTypeId,
            instanceLocator: request.instanceLocator,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clear',
    validated(
      ClearOverrideRequestSchema,
      z.void(),
      async (_event, request: ClearOverrideRequest): Promise<void> => {
        console.log('[IPC] overrides:clear', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clear',
            instanceId: request.instanceId,
            path: request.path,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearInstance',
    validated(
      ClearInstanceOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearInstanceOverridesRequest): Promise<void> => {
        console.log('[IPC] overrides:clearInstance', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clearInstance',
            instanceId: request.instanceId,
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:clearAll',
    validated(
      ClearAllOverridesRequestSchema,
      z.void(),
      async (_event, request: ClearAllOverridesRequest): Promise<void> => {
        console.log('[IPC] overrides:clearAll', request);
        await applyOverrideOps(request.sessionId, [
          {
            op: 'clearAll',
          },
        ]);
      }
    )
  );

  ipcMain.handle(
    'overrides:save',
    validated(
      SaveOverridesRequestSchema,
      SaveOverridesResponseSchema,
      async (_event, _request: SaveOverridesRequest): Promise<SaveOverridesResponse> => {
        console.log('[IPC] overrides:save');

        const allOverrides = overrideStore.getAllOverrides();
        if (allOverrides.length === 0) {
          return { ok: true, appliedCount: 0, failed: [] };
        }

        const draftOverrides: DraftOverride[] = allOverrides.map(({ sessionId, override }) => ({
          sessionId,
          instanceId: override.instanceId as any,
          path: override.path as string,
          value: override.value,
          componentTypeId: override.componentTypeId as any,
          instanceLocator: override.instanceLocator,
        }));

        let plan;
        try {
          plan = await extensionHostManager.promoteOverrides(draftOverrides);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Promotion failed';
          return {
            ok: false,
            appliedCount: 0,
            failed: draftOverrides.map((override) => ({
              address: {
                sessionId: override.sessionId,
                instanceId: override.instanceId,
                path: override.path,
              },
              result: {
                ok: false,
                code: 'internalError',
                message,
              },
            })),
          };
        }

        if (plan.failed.length > 0) {
          return {
            ok: false,
            appliedCount: 0,
            failed: plan.failed,
          };
        }

        if (plan.edits.length === 0) {
          return {
            ok: false,
            appliedCount: 0,
            failed: mapFailures(
              draftOverrides,
              'internalError',
              'Save promoter returned no edits.'
            ),
          };
        }

        const workspacePath = workspaceManager.getCurrentWorkspace()?.path ?? null;
        if (!workspacePath) {
          return {
            ok: false,
            appliedCount: 0,
            failed: mapFailures(
              draftOverrides,
              'internalError',
              'No workspace open for save.'
            ),
          };
        }

        const applyResult = await applyWorkspaceEdits(workspacePath, plan.edits);
        if (!applyResult.ok) {
          return {
            ok: false,
            appliedCount: 0,
            failed: mapFailures(
              draftOverrides,
              'internalError',
              applyResult.error.message
            ),
          };
        }

        await clearSavedOverrides(allOverrides);

        return {
          ok: true,
          appliedCount: draftOverrides.length,
          failed: [],
        };
      }
    )
  );
}

/**
 * Apply override operations and notify affected parties.
 */
async function applyOverrideOps(sessionId: string, ops: OverrideOp[]): Promise<void> {
  // Get session to determine target type
  const session = previewSessionManager.getSession(sessionId as any);
  if (!session) {
    console.error(`[IPC] Cannot apply overrides: session ${sessionId} not found`);
    return;
  }

  // Apply to override store
  await overrideStore.applyOps(sessionId as any, session.target, ops);

  // Forward to runtime adapter
  previewSessionManager.applyOverrides(sessionId as any, ops);

  // Broadcast to renderer
  const allOverrides = overrideStore.getSessionOverrides(sessionId as any);
  broadcastOverridesChanged({
    sessionId: sessionId as any,
    overrides: allOverrides.map((op) => ({
      instanceId: op.instanceId! as string,
      path: op.path! as string,
      value: op.value!,
      componentTypeId: op.componentTypeId as any,
      instanceLocator: op.instanceLocator,
    })),
  });
}

/**
 * Broadcast overrides changed event to all renderer windows.
 */
export function broadcastOverridesChanged(event: OverridesChangedEvent) {
  const validated = validateEvent(
    OverridesChangedEventSchema,
    event,
    'overrides:changed'
  );
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send('overrides:changed', validated);
  });
}

async function clearSavedOverrides(
  allOverrides: ReturnType<typeof overrideStore.getAllOverrides>
): Promise<void> {
  const bySession = new Map<
    string,
    { target: (typeof allOverrides)[number]['target']; ops: OverrideOp[] }
  >();

  for (const entry of allOverrides) {
    const sessionKey = entry.sessionId as string;
    const existing = bySession.get(sessionKey);
    const op: OverrideOp = {
      op: 'clear',
      instanceId: entry.override.instanceId,
      path: entry.override.path,
    };

    if (existing) {
      existing.ops.push(op);
    } else {
      bySession.set(sessionKey, {
        target: entry.target,
        ops: [op],
      });
    }
  }

  for (const [sessionId, { target, ops }] of bySession) {
    await overrideStore.applyOps(sessionId as any, target, ops);
    previewSessionManager.applyOverrides(sessionId as any, ops);

    const remaining = overrideStore.getSessionOverrides(sessionId as any);
    broadcastOverridesChanged({
      sessionId: sessionId as any,
      overrides: remaining.map((op) => ({
        instanceId: op.instanceId! as string,
        path: op.path! as string,
        value: op.value!,
        componentTypeId: op.componentTypeId as any,
        instanceLocator: op.instanceLocator,
      })),
    });
  }
}

function mapFailures(
  overrides: DraftOverride[],
  code: SaveFailure['result']['code'],
  message: string
): SaveFailure[] {
  return overrides.map((override) => ({
    address: {
      sessionId: override.sessionId,
      instanceId: override.instanceId,
      path: override.path,
    },
    result: {
      ok: false,
      code,
      message,
    },
  }));
}
