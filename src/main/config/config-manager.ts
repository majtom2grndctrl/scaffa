import type { SkaffaConfig } from '../../shared/index.js';
import { loadConfig, getDefaultConfig, type ConfigLoadResult } from './config-loader.js';
import { registryManager } from '../registry/registry-manager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Config Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages the current project configuration.

// Avoid circular dependency: extension host manager will be imported lazily
let extensionHostManager: typeof import('../extension-host/extension-host-manager.js').extensionHostManager | null = null;

class ConfigManager {
  private currentConfig: SkaffaConfig = getDefaultConfig();
  private loadResult: ConfigLoadResult | null = null;

  /**
   * Load config for the given workspace path.
   * Returns the load result (success or error details).
   */
  async loadForWorkspace(
    workspacePath: string | null,
    options?: { notifyExtensionHost?: boolean }
  ): Promise<ConfigLoadResult> {
    const notifyExtensionHost = options?.notifyExtensionHost ?? true;
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

      // Notify extension host (if available)
      if (notifyExtensionHost) {
        this.notifyExtensionHost();
      }

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
    // Note: Registry will be updated by extension host contributions
    registryManager.recomposeWithConfig(this.currentConfig);

    // Notify extension host
    if (notifyExtensionHost) {
      this.notifyExtensionHost();
    }

    return this.loadResult;
  }

  /**
   * Notify extension host of config change.
   */
  private notifyExtensionHost(): void {
    // Lazy load extension host manager to avoid circular dependency
    if (!extensionHostManager) {
      void import('../extension-host/extension-host-manager.js').then((module) => {
        extensionHostManager = module.extensionHostManager;
        extensionHostManager?.updateConfig(this.currentConfig);
      });
    } else {
      extensionHostManager.updateConfig(this.currentConfig);
    }
  }

  /**
   * Get the current effective config.
   */
  getCurrentConfig(): SkaffaConfig {
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
