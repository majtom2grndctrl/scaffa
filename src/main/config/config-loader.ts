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
// Loads and validates scaffa.config.ts from a workspace.

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
 * Load and validate scaffa.config.ts from a workspace.
 *
 * @param workspacePath - Absolute path to the workspace folder
 * @returns Load result with config or error
 */
export async function loadConfig(
  workspacePath: WorkspacePath | string
): Promise<ConfigLoadResult> {
  const configPath = path.join(workspacePath, 'scaffa.config.ts');

  try {
    // Check if config file exists
    try {
      await fs.access(configPath);
    } catch {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Config file not found: ${configPath}`,
        },
      };
    }

    // For v0: We expect a compiled .js version to exist alongside the .ts file
    // In production, projects would compile their config as part of their build
    // For now, we'll look for a .js version or use dynamic import with tsx/ts-node
    const jsConfigPath = configPath.replace(/\.ts$/, '.js');
    let configModule: { default?: unknown };

    try {
      // Try to load compiled .js version first
      const fileUrl = pathToFileURL(jsConfigPath).href;
      configModule = await import(fileUrl);
    } catch {
      // If no .js version exists, try loading .ts directly
      // This requires the workspace to have ts-node or similar set up
      // For v0, we'll return an error and document this requirement
      return {
        success: false,
        error: {
          code: 'INVALID_SYNTAX',
          message: `Config must be compiled to .js. Run 'tsc scaffa.config.ts' in your workspace.`,
          details: {
            configPath,
            hint: 'Ensure scaffa.config.js exists alongside scaffa.config.ts',
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
