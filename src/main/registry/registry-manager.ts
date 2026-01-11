import type { ComponentRegistry, ScaffaConfig } from '../../shared/index.js';
import { composeRegistry, getEmptyRegistry } from './registry-composer.js';

// ─────────────────────────────────────────────────────────────────────────────
// Registry Manager (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages the effective component registry.

class RegistryManager {
  private effectiveRegistry: ComponentRegistry = getEmptyRegistry();
  private moduleRegistries: ComponentRegistry[] = [];

  /**
   * Update the effective registry based on module registries and config.
   *
   * @param moduleRegistries - Registries from loaded modules (in order)
   * @param config - Current project configuration
   */
  updateRegistry(moduleRegistries: ComponentRegistry[], config: ScaffaConfig): void {
    this.moduleRegistries = moduleRegistries;
    this.effectiveRegistry = composeRegistry(moduleRegistries, config);
    console.log('[Registry] Registry updated');
  }

  /**
   * Get the current effective registry.
   */
  getEffectiveRegistry(): ComponentRegistry {
    return this.effectiveRegistry;
  }

  /**
   * Recompose the registry with the current module registries and new config.
   * Called when config changes without changing modules.
   */
  recomposeWithConfig(config: ScaffaConfig): void {
    this.effectiveRegistry = composeRegistry(this.moduleRegistries, config);
    console.log('[Registry] Registry recomposed with new config');
  }
}

// Singleton instance
export const registryManager = new RegistryManager();
