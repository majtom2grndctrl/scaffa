import type { ScaffaConfig } from '../../shared/index.js';
import { loadConfig, getDefaultConfig, type ConfigLoadResult } from './config-loader.js';
import { registryManager } from '../registry/registry-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages the current project configuration.

class ConfigManager {
  private currentConfig: ScaffaConfig = getDefaultConfig();
  private loadResult: ConfigLoadResult | null = null;

  /**
   * Load config for the given workspace path.
   * Returns the load result (success or error details).
   */
  async loadForWorkspace(workspacePath: string | null): Promise<ConfigLoadResult> {
    if (!workspacePath) {
      // No workspace - use default config
      this.currentConfig = getDefaultConfig();
      this.loadResult = {
        success: true,
        config: this.currentConfig,
      };
      console.log('[Config] No workspace - using default config');

      // Update registry with empty config
      registryManager.recomposeWithConfig(this.currentConfig);

      return this.loadResult;
    }

    // Load config from workspace
    this.loadResult = await loadConfig(workspacePath);

    if (this.loadResult.success && this.loadResult.config) {
      this.currentConfig = this.loadResult.config;
      console.log('[Config] Config loaded successfully');
    } else {
      // On error, fall back to default config
      this.currentConfig = getDefaultConfig();
      console.error('[Config] Failed to load config:', this.loadResult.error);
    }

    // Update registry with new config
    // Note: In v0, we don't have module registries yet, so this will use empty modules
    registryManager.recomposeWithConfig(this.currentConfig);

    return this.loadResult;
  }

  /**
   * Get the current effective config.
   */
  getCurrentConfig(): ScaffaConfig {
    return this.currentConfig;
  }

  /**
   * Get the last load result (for error reporting).
   */
  getLoadResult(): ConfigLoadResult | null {
    return this.loadResult;
  }
}

// Singleton instance
export const configManager = new ConfigManager();
