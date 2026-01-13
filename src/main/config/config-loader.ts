import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  ScaffaConfigSchema,
  type ScaffaConfig,
  type WorkspacePath,
} from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config Loader (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Loads and validates scaffa.config.js from a workspace.

export interface ConfigLoadResult {
  success: boolean;
  config?: ScaffaConfig;
  error?: {
    code: 'NOT_FOUND' | 'INVALID_SYNTAX' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
    message: string;
    details?: unknown;
  };
}

/**
 * Load and validate scaffa.config.js from a workspace.
 *
 * @param workspacePath - Absolute path to the workspace folder
 * @returns Load result with config or error
 */
export async function loadConfig(
  workspacePath: WorkspacePath | string
): Promise<ConfigLoadResult> {
  const jsConfigPath = path.join(workspacePath, 'scaffa.config.js');
  const tsConfigPath = path.join(workspacePath, 'scaffa.config.ts');

  try {
    // Check if runtime config exists
    const hasJsConfig = await fs
      .access(jsConfigPath)
      .then(() => true)
      .catch(() => false);
    const hasTsConfig = await fs
      .access(tsConfigPath)
      .then(() => true)
      .catch(() => false);

    if (!hasJsConfig) {
      if (hasTsConfig) {
        return {
          success: false,
          error: {
            code: 'INVALID_SYNTAX',
            message:
              'Scaffa config must be JavaScript at runtime. Compile scaffa.config.ts to scaffa.config.js.',
            details: {
              tsConfigPath,
              hint: 'Ensure scaffa.config.js exists alongside scaffa.config.ts',
            },
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Config file not found: ${jsConfigPath}`,
        },
      };
    }

    let configModule: { default?: unknown };

    try {
      const fileUrl = pathToFileURL(jsConfigPath).href;
      configModule = await import(fileUrl);
    } catch {
      return {
        success: false,
        error: {
          code: 'INVALID_SYNTAX',
          message:
            'Failed to load scaffa.config.js. Ensure it is valid JavaScript and exports a default config.',
          details: {
            jsConfigPath,
          },
        },
      };
    }

    // Extract default export
    const rawConfig = configModule.default;

    if (!rawConfig) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Config file must export a default configuration',
        },
      };
    }

    // Validate against schema
    const config = ScaffaConfigSchema.parse(rawConfig);

    console.log('[Config] Loaded config:', {
      modules: config.modules?.length ?? 0,
      overrides: Object.keys(config.components?.overrides ?? {}).length,
    });

    return {
      success: true,
      config,
    };
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      // Zod validation error
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Config validation failed',
          details: error,
        },
      };
    }

    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error loading config',
        details: error,
      },
    };
  }
}

/**
 * Get default/empty config when no workspace is loaded.
 */
export function getDefaultConfig(): ScaffaConfig {
  return ScaffaConfigSchema.parse({});
}
