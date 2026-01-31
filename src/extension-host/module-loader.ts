// ─────────────────────────────────────────────────────────────────────────────
// Module Loader (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Loads and activates extension modules from skaffa.config.js.

import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { createRequire } from 'node:module';
import type { SkaffaConfig, SkaffaModule } from '../shared/config.js';
import type { ComponentRegistry, ComponentTypeId } from '../shared/index.js';
import type { GraphPatch } from '../shared/project-graph.js';
import type {
  ExtensionContext,
  ExtensionModule,
  Disposable,
  RegistryAPI,
  GraphAPI,
  GraphProducer,
  PreviewAPI,
  PreviewLauncher,
  SaveAPI,
  SavePromoter,
  UIAPI,
} from './extension-context.js';
import type { ExtHostToMainMessage } from './ipc-protocol.js';
import type { DraftOverride, SavePlan } from '../shared/save.js';
import type { InspectorSectionContribution } from '../shared/inspector-sections.js';

// ─────────────────────────────────────────────────────────────────────────────
// Module State
// ─────────────────────────────────────────────────────────────────────────────

interface LoadedModule {
  id: string;
  module: ExtensionModule;
  context: ExtensionContext;
}

// ─────────────────────────────────────────────────────────────────────────────
// Module Loader
// ─────────────────────────────────────────────────────────────────────────────

export class ModuleLoader {
  private workspacePath: string | null;
  private config: SkaffaConfig;
  private loadedModules: Map<string, LoadedModule> = new Map();
  private registryContributions: ComponentRegistry[] = [];
  private graphProducers: Map<string, GraphProducer> = new Map();
  private previewLaunchers: Map<string, PreviewLauncher> = new Map();
  private savePromoters: Map<string, SavePromoter> = new Map();
  private inspectorSections: InspectorSectionContribution[] = [];

  constructor(workspacePath: string | null, config: SkaffaConfig) {
    this.workspacePath = workspacePath;
    this.config = config;
  }

  /**
   * Load and activate all modules from config.
   */
  async loadAndActivateModules(): Promise<void> {
    const modules = this.config.modules ?? [];

    if (modules.length === 0) {
      console.log('[ModuleLoader] No modules to load');
      this.sendRegistryContributions();
      return;
    }

    console.log(`[ModuleLoader] Loading ${modules.length} module(s)...`);

    for (const moduleConfig of modules) {
      try {
        await this.loadModule(moduleConfig);
        // Report success
        this.sendToMain({
          type: 'module-activation-status',
          moduleId: moduleConfig.id,
          status: 'success',
        });
      } catch (error) {
        console.error(`[ModuleLoader] Failed to load module ${moduleConfig.id}:`, error);
        // Report failure
        this.sendToMain({
          type: 'module-activation-status',
          moduleId: moduleConfig.id,
          status: 'failed',
          error: {
            code: 'MODULE_LOAD_FAILED',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        });
        // Continue loading other modules
      }
    }

    console.log(`[ModuleLoader] Loaded ${this.loadedModules.size} module(s)`);

    // Send registry contributions to main
    this.sendRegistryContributions();
  }

  /**
   * Load and activate a single module.
   */
  private async loadModule(moduleConfig: SkaffaModule): Promise<void> {
    const moduleId = moduleConfig.id;

    if (this.loadedModules.has(moduleId)) {
      console.warn(`[ModuleLoader] Module ${moduleId} already loaded, skipping`);
      return;
    }

    console.log(`[ModuleLoader] Loading module: ${moduleId}`);

    // Resolve module path
    const modulePath = this.resolveModulePath(moduleConfig);
    if (!modulePath) {
      throw new Error(`Cannot resolve module path for: ${moduleConfig.id}`);
    }

    // Import module
    const moduleExports = await this.importModule(modulePath);
    if (!moduleExports.activate) {
      throw new Error(`Module ${moduleId} does not export an activate function`);
    }

    // Create extension context
    const context = this.createExtensionContext(moduleId);

    // Store loaded module
    this.loadedModules.set(moduleId, {
      id: moduleId,
      module: moduleExports,
      context,
    });

    // Activate module
    console.log(`[ModuleLoader] Activating module: ${moduleId}`);
    await moduleExports.activate(context);
    console.log(`[ModuleLoader] Module activated: ${moduleId}`);
  }

  /**
   * Resolve module path from config.
   */
  private resolveModulePath(moduleConfig: SkaffaModule): string | null {
    // v0: Path resolution anchored at the workspace root (directory containing skaffa.config.*).
    // Supports:
    // - file paths via `module.path` (relative to workspace root; absolute ok)
    // - npm packages via `module.package` (Node resolution anchored at workspace root)
    // - fallback: attempt to resolve `module.id` as a package

    if (moduleConfig.path) {
      if (this.workspacePath) {
        let resolvedPath: string;

        // Support workspace-anchored convenience prefixes.
        // - "@/x" means "<workspaceRoot>/x"
        // - "workspace:/x" means "<workspaceRoot>/x"
        if (moduleConfig.path.startsWith('@/')) {
          resolvedPath = path.resolve(this.workspacePath, moduleConfig.path.slice(2));
        } else if (moduleConfig.path.startsWith('workspace:')) {
          const rest = moduleConfig.path.slice('workspace:'.length).replace(/^\/+/, '');
          resolvedPath = path.resolve(this.workspacePath, rest);
        } else {
          resolvedPath = path.resolve(this.workspacePath, moduleConfig.path);
        }

        // Security: validate path doesn't escape workspace
        if (!this.isPathWithinWorkspace(resolvedPath)) {
          console.error(
            `[ModuleLoader] Module path escapes workspace: ${moduleConfig.path} resolves to ${resolvedPath}`
          );
          return null;
        }

        return resolvedPath;
      }
      return path.resolve(moduleConfig.path);
    }

    const packageSpecifier = moduleConfig.package ?? moduleConfig.id;
    const resolvedPackageEntry = this.resolvePackageEntry(packageSpecifier);
    if (resolvedPackageEntry) {
      return resolvedPackageEntry;
    }

    return null;
  }

  /**
   * Validate that a resolved path is within the workspace directory.
   * Prevents path traversal attacks via malicious config.
   */
  private isPathWithinWorkspace(resolvedPath: string): boolean {
    if (!this.workspacePath) {
      return true; // No workspace context, allow all paths
    }

    // Normalize both paths to handle symlinks and relative segments
    const normalizedWorkspace = path.resolve(this.workspacePath);
    const normalizedPath = path.resolve(resolvedPath);

    // Check if the resolved path is under the workspace
    return normalizedPath.startsWith(normalizedWorkspace + path.sep) ||
           normalizedPath === normalizedWorkspace;
  }

  private resolvePackageEntry(specifier: string): string | null {
    try {
      const req = createRequire(import.meta.url);
      if (this.workspacePath) {
        return req.resolve(specifier, { paths: [this.workspacePath] });
      }
      return req.resolve(specifier);
    } catch {
      return null;
    }
  }

  /**
   * Import module dynamically.
   */
  private async importModule(modulePath: string): Promise<ExtensionModule> {
    const fileUrl = pathToFileURL(modulePath).href;
    const module = await import(fileUrl);
    const direct = module as Partial<ExtensionModule>;
    if (typeof direct?.activate === 'function') {
      return module as ExtensionModule;
    }
    const cjsDefault = (module as any)?.default as Partial<ExtensionModule> | undefined;
    if (typeof cjsDefault?.activate === 'function') {
      return cjsDefault as ExtensionModule;
    }
    return module as ExtensionModule;
  }

  /**
   * Create extension context for a module.
   */
  private createExtensionContext(moduleId: string): ExtensionContext {
    const subscriptions: Disposable[] = [];

    const registryAPI: RegistryAPI = {
      contributeRegistry: (registry: ComponentRegistry) => {
        this.registryContributions.push(registry);
        console.log(`[ModuleLoader] Module ${moduleId} contributed registry`);

        // Return disposable to remove contribution
        return {
          dispose: () => {
            const index = this.registryContributions.indexOf(registry);
            if (index !== -1) {
              this.registryContributions.splice(index, 1);
            }
          },
        };
      },
    };

    const graphAPI: GraphAPI = {
      registerProducer: (producer: GraphProducer) => {
        this.graphProducers.set(producer.id, producer);
        console.log(`[ModuleLoader] Module ${moduleId} registered graph producer: ${producer.id}`);

        // Initialize and start producer
        void this.startGraphProducer(producer);

        // Return disposable to unregister
        return {
          dispose: () => {
            this.graphProducers.delete(producer.id);
          },
        };
      },
    };

    const previewAPI: PreviewAPI = {
      registerLauncher: (launcher: PreviewLauncher) => {
        const launcherId = launcher.descriptor.id;
        this.previewLaunchers.set(launcherId, launcher);
        console.log(
          `[ModuleLoader] Module ${moduleId} registered preview launcher: ${launcherId}`
        );

        // Send launcher descriptor to main
        this.sendToMain({
          type: 'launcher-registered',
          descriptor: launcher.descriptor,
        });

        // Subscribe to launcher logs and forward to main
        const unsubscribe = launcher.onLog((entry) => {
          this.sendToMain({
            type: 'preview-launcher-log',
            launcherId,
            entry,
          });
        });

        // Return disposable to unregister
        return {
          dispose: () => {
            this.previewLaunchers.delete(launcherId);
            unsubscribe.dispose();
          },
        };
      },
    };

    const saveAPI: SaveAPI = {
      registerPromoter: (promoter: SavePromoter) => {
        this.savePromoters.set(promoter.id, promoter);
        console.log(`[ModuleLoader] Module ${moduleId} registered save promoter: ${promoter.id}`);

        return {
          dispose: () => {
            this.savePromoters.delete(promoter.id);
          },
        };
      },
    };

    const uiAPI: UIAPI = {
      registerInspectorSection: (section: InspectorSectionContribution) => {
        this.inspectorSections.push(section);
        console.log(`[ModuleLoader] Module ${moduleId} registered inspector section: ${section.id}`);

        // Send section registration to main
        this.sendToMain({
          type: 'inspector-section-registered',
          section,
        });

        // Return disposable to unregister
        return {
          dispose: () => {
            const index = this.inspectorSections.indexOf(section);
            if (index !== -1) {
              this.inspectorSections.splice(index, 1);
            }
          },
        };
      },
    };

    return {
      apiVersion: 'v0',
      extensionId: moduleId,
      workspaceRoot: this.workspacePath,
      registry: registryAPI,
      graph: graphAPI,
      preview: previewAPI,
      save: saveAPI,
      ui: uiAPI,
      subscriptions,
    };
  }

  /**
   * Start a graph producer.
   */
  private async startGraphProducer(producer: GraphProducer): Promise<void> {
    try {
      // Initialize and get snapshot
      const snapshot = await producer.initialize();
      this.sendToMain({
        type: 'graph-snapshot',
        producerId: producer.id,
        snapshot,
      });

      // Start producing patches
      producer.start((patch: GraphPatch) => {
        this.sendToMain({
          type: 'graph-patch',
          producerId: producer.id,
          patch,
        });
      });
    } catch (error) {
      console.error(`[ModuleLoader] Failed to start graph producer ${producer.id}:`, error);
    }
  }

  /**
   * Start a preview launcher.
   */
  async startPreviewLauncher(
    launcherId: string,
    options: Record<string, unknown>,
    requestId: string
  ): Promise<void> {
    const launcher = this.previewLaunchers.get(launcherId);

    if (!launcher) {
      this.sendToMain({
        type: 'preview-launcher-error',
        requestId,
        launcherId,
        error: {
          code: 'LAUNCHER_NOT_FOUND',
          message: `Preview launcher ${launcherId} not found`,
        },
      });
      return;
    }

    try {
      console.log(`[ModuleLoader] Starting preview launcher: ${launcherId}`);

      // Compose the registry snapshot for instrumentation
      const registrySnapshot = this.composeRegistrySnapshot();

      const context = {
        projectEntry: this.config.preview?.entry,
        projectStyles: this.config.preview?.styles,
        environment: this.config.preview?.environment,
        registrySnapshot,
      };

      const result = await launcher.start(options, context);

      this.sendToMain({
        type: 'preview-launcher-started',
        requestId,
        launcherId,
        result,
      });
    } catch (error) {
      console.error(`[ModuleLoader] Failed to start preview launcher ${launcherId}:`, error);
      this.sendToMain({
        type: 'preview-launcher-error',
        requestId,
        launcherId,
        error: {
          code: 'LAUNCHER_START_FAILED',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  /**
   * Stop a preview launcher.
   */
  async stopPreviewLauncher(launcherId: string, requestId: string): Promise<void> {
    const launcher = this.previewLaunchers.get(launcherId);

    if (!launcher) {
      this.sendToMain({
        type: 'preview-launcher-error',
        requestId,
        launcherId,
        error: {
          code: 'LAUNCHER_NOT_FOUND',
          message: `Preview launcher ${launcherId} not found`,
        },
      });
      return;
    }

    try {
      console.log(`[ModuleLoader] Stopping preview launcher: ${launcherId}`);
      await launcher.stop();

      this.sendToMain({
        type: 'preview-launcher-stopped',
        requestId,
        launcherId,
      });
    } catch (error) {
      console.error(`[ModuleLoader] Failed to stop preview launcher ${launcherId}:`, error);
      this.sendToMain({
        type: 'preview-launcher-error',
        requestId,
        launcherId,
        error: {
          code: 'LAUNCHER_STOP_FAILED',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
      });
    }
  }

  /**
   * Compose all registry contributions into a single snapshot.
   * Uses v0 composition rules: later modules overwrite earlier ones for same typeId.
   * See: docs/skaffa_component_registry_schema.md (4.1)
   */
  private composeRegistrySnapshot(): ComponentRegistry {
    const composed: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {},
    };

    // Merge in order: later contributions win for same typeId
    for (const registry of this.registryContributions) {
      for (const [typeId, entry] of Object.entries(registry.components)) {
        composed.components[typeId as ComponentTypeId] = entry;
      }
    }

    return composed;
  }

  /**
   * Promote overrides using the first registered save promoter.
   */
  async promoteOverrides(overrides: DraftOverride[]): Promise<SavePlan> {
    const promoter = this.getSavePromoter();
    if (!promoter) {
      return {
        edits: [],
        failed: overrides.map((override) => ({
          address: {
            sessionId: override.sessionId,
            instanceId: override.instanceId,
            path: override.path,
          },
          result: {
            ok: false,
            code: 'unpromotable',
            message: 'No save promoter registered for this workspace.',
          },
        })),
      };
    }

    return promoter.promote(overrides);
  }

  /**
   * Send registry contributions to main process.
   */
  private sendRegistryContributions(): void {
    console.log(`[ModuleLoader] Sending ${this.registryContributions.length} registry contribution(s) to main`);
    for (const registry of this.registryContributions) {
      const componentIds = Object.keys(registry.components);
      console.log(`[ModuleLoader]   - ${componentIds.length} components: ${componentIds.join(', ') || '(none)'}`);
    }
    this.sendToMain({
      type: 'registry-contribution',
      registries: this.registryContributions,
    });
    console.log('[ModuleLoader] Registry contributions sent to main');
  }

  private getSavePromoter(): SavePromoter | null {
    const promoters = Array.from(this.savePromoters.values());
    if (promoters.length === 0) {
      return null;
    }
    if (promoters.length > 1) {
      console.warn(
        `[ModuleLoader] Multiple save promoters registered; using "${promoters[0].id}"`
      );
    }
    return promoters[0];
  }

  /**
   * Send message to main process.
   */
  private sendToMain(message: ExtHostToMainMessage): void {
    if (!process.send) {
      console.error('[ModuleLoader] Cannot send message: process.send is not available');
      return;
    }
    process.send(message);
  }

  /**
   * Reload modules with new config.
   */
  async reload(newConfig: SkaffaConfig): Promise<void> {
    // Deactivate all current modules
    await this.deactivateAll();

    // Clear state
    this.loadedModules.clear();
    this.registryContributions = [];
    this.graphProducers.clear();
    this.previewLaunchers.clear();
    this.savePromoters.clear();

    // Update config
    this.config = newConfig;

    // Load new modules
    await this.loadAndActivateModules();
  }

  /**
   * Deactivate all modules.
   */
  async deactivateAll(): Promise<void> {
    console.log('[ModuleLoader] Deactivating all modules...');

    for (const [moduleId, loaded] of this.loadedModules) {
      try {
        // Call deactivate if present
        if (loaded.module.deactivate) {
          await loaded.module.deactivate();
        }

        // Dispose all subscriptions
        for (const disposable of loaded.context.subscriptions) {
          await disposable.dispose();
        }

        console.log(`[ModuleLoader] Module deactivated: ${moduleId}`);
      } catch (error) {
        console.error(`[ModuleLoader] Failed to deactivate module ${moduleId}:`, error);
      }
    }
  }
}
