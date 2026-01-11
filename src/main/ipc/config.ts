import { ipcMain } from 'electron';
import { z } from 'zod';
import {
  ScaffaConfigSchema,
  type ScaffaConfig,
} from '../../shared/index.js';
import { validated } from './validation.js';
import { configManager } from '../config/config-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config IPC Handlers (v0)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Request to get the current effective config.
 */
export const GetConfigRequestSchema = z.object({});
export type GetConfigRequest = z.infer<typeof GetConfigRequestSchema>;

/**
 * Response with current config and load status.
 */
export const GetConfigResponseSchema = z.object({
  config: ScaffaConfigSchema,
  loadError: z
    .object({
      code: z.enum(['NOT_FOUND', 'INVALID_SYNTAX', 'VALIDATION_ERROR', 'UNKNOWN_ERROR']),
      message: z.string(),
    })
    .nullable(),
});
export type GetConfigResponse = z.infer<typeof GetConfigResponseSchema>;

/**
 * Register config IPC handlers.
 */
export function registerConfigHandlers() {
  ipcMain.handle(
    'config:get',
    validated(
      GetConfigRequestSchema,
      GetConfigResponseSchema,
      async (_event, _request: GetConfigRequest): Promise<GetConfigResponse> => {
        console.log('[IPC] config:get');

        const config = configManager.getCurrentConfig();
        const loadResult = configManager.getLoadResult();

        return {
          config,
          loadError: loadResult?.success
            ? null
            : loadResult?.error
              ? {
                  code: loadResult.error.code,
                  message: loadResult.error.message,
                }
              : null,
        };
      }
    )
  );
}
