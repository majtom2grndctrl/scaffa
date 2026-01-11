import { ipcMain } from 'electron';
import { z } from 'zod';
import { ComponentRegistrySchema, type ComponentRegistry } from '../../shared/index.js';
import { validated } from './validation.js';
import { registryManager } from '../registry/registry-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Registry IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request to get the effective component registry.
 */
export const GetRegistryRequestSchema = z.object({});
export type GetRegistryRequest = z.infer<typeof GetRegistryRequestSchema>;

/**
 * Response with the effective registry.
 */
export const GetRegistryResponseSchema = ComponentRegistrySchema;
export type GetRegistryResponse = z.infer<typeof GetRegistryResponseSchema>;

/**
 * Register registry IPC handlers.
 */
export function registerRegistryHandlers() {
  ipcMain.handle(
    'registry:get',
    validated(
      GetRegistryRequestSchema,
      GetRegistryResponseSchema,
      async (_event, _request: GetRegistryRequest): Promise<GetRegistryResponse> => {
        console.log('[IPC] registry:get');
        return registryManager.getEffectiveRegistry();
      }
    )
  );
}
