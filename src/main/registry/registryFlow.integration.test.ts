/**
 * Registry Flow Integration Tests (Main Process Perspective)
 *
 * These tests verify the complete registry loading flow:
 *
 *   Extension Host (registry-contribution) → Main Process (registryManager) → IPC Handler
 *
 * This is a critical Skaffa workflow:
 * - Extension modules contribute registries during activation
 * - Main process receives and composes the effective registry
 * - Renderer fetches the registry via IPC
 *
 * Key invariant: The registry MUST be populated before the renderer can use it.
 * If this flow breaks, the Inspector will show undefined/empty data.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ComponentRegistry } from '../../shared/index.js';
import type { SkaffaConfig } from '../../shared/config.js';
import type { RegistryContributionMessage } from '../../extension-host/ipc-protocol.js';

// Mock electron to avoid Electron-specific APIs
vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn(),
  },
}));

describe('Registry Flow - Main Process Integration', () => {
  // Test fixtures - use type assertion to handle branded ComponentTypeId
  const mockConfig: SkaffaConfig = {
    schemaVersion: 'v0',
    preview: {
      entry: './src/App.tsx',
      styles: [],
    },
    modules: [],
  };

  // Helper to create a properly typed mock registry
  const createMockRegistry = (): ComponentRegistry => ({
    schemaVersion: 'v0',
    components: {
      'demo.button': {
        displayName: 'Demo Button',
        props: {
          label: {
            propName: 'label',
            exposure: { kind: 'editable', control: { kind: 'string' } },
          },
          variant: {
            propName: 'variant',
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                ],
              },
            },
          },
        },
      },
      'demo.card': {
        displayName: 'Demo Card',
        props: {
          title: {
            propName: 'title',
            exposure: { kind: 'editable', control: { kind: 'string' } },
          },
        },
      },
    } as ComponentRegistry['components'],
  });

  // Fresh import the modules for each test to avoid state leakage
  let registryManager: typeof import('./registry-manager.js').registryManager;
  let getEmptyRegistry: typeof import('./registry-composer.js').getEmptyRegistry;

  beforeEach(async () => {
    vi.resetModules();

    // Fresh imports
    const registryManagerModule = await import('./registry-manager.js');
    const composerModule = await import('./registry-composer.js');

    registryManager = registryManagerModule.registryManager;
    getEmptyRegistry = composerModule.getEmptyRegistry;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: Registry Manager - Initial State
  // ─────────────────────────────────────────────────────────────────────────

  describe('Step 1: Registry Manager Initial State', () => {
    /**
     * Before any module contributions, the registry should be empty.
     * This is the state when Skaffa first starts or when no modules load.
     */
    it('should return empty registry before any contributions', () => {
      const registry = registryManager.getEffectiveRegistry();

      expect(registry).toEqual(getEmptyRegistry());
      expect(registry.schemaVersion).toBe('v0');
      expect(Object.keys(registry.components)).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: Registry Composition - Module Contribution
  // ─────────────────────────────────────────────────────────────────────────

  describe('Step 2: Registry Composition from Module Contribution', () => {
    /**
     * When the extension host sends a registry-contribution message,
     * the registry manager should compose an effective registry.
     *
     * This simulates: ExtensionHostManager.handleRegistryContribution()
     */
    it('should compose registry from single module contribution', () => {
      const mockModuleRegistry = createMockRegistry();

      // Simulates: registryManager.updateRegistry(message.registries, config)
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);

      const effective = registryManager.getEffectiveRegistry();

      // VERIFY: Registry contains module contributions
      expect(effective.schemaVersion).toBe('v0');
      expect(Object.keys(effective.components)).toHaveLength(2);
      expect(effective.components['demo.button' as keyof typeof effective.components]).toBeDefined();
      expect(effective.components['demo.card' as keyof typeof effective.components]).toBeDefined();
    });

    /**
     * Multiple modules can contribute registries that get merged.
     */
    it('should compose registry from multiple module contributions', () => {
      const mockModuleRegistry = createMockRegistry();

      const secondRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'ui.input': {
            displayName: 'Input Field',
            props: {
              placeholder: {
                propName: 'placeholder',
                exposure: { kind: 'editable', control: { kind: 'string' } },
              },
            },
          },
        } as ComponentRegistry['components'],
      };

      registryManager.updateRegistry([mockModuleRegistry, secondRegistry], mockConfig);

      const effective = registryManager.getEffectiveRegistry();

      // VERIFY: Both modules' components are present
      expect(Object.keys(effective.components)).toHaveLength(3);
      expect(effective.components['demo.button' as keyof typeof effective.components]).toBeDefined();
      expect(effective.components['demo.card' as keyof typeof effective.components]).toBeDefined();
      expect(effective.components['ui.input' as keyof typeof effective.components]).toBeDefined();
    });

    /**
     * Project config can override module registry entries.
     */
    it('should apply config overrides to module registry entries', () => {
      const mockModuleRegistry = createMockRegistry();

      const configWithOverrides: SkaffaConfig = {
        ...mockConfig,
        components: {
          overrides: {
            'demo.button': {
              displayName: 'Custom Button', // Override displayName
            },
          } as SkaffaConfig['components'],
        },
      };

      registryManager.updateRegistry([mockModuleRegistry], configWithOverrides);

      const effective = registryManager.getEffectiveRegistry();
      const buttonEntry = effective.components['demo.button' as keyof typeof effective.components];

      // VERIFY: Config override applied
      expect(buttonEntry?.displayName).toBe('Custom Button');
      // Other properties should be preserved from module
      expect(buttonEntry?.props).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Step 3: Registry Update - Recomposition
  // ─────────────────────────────────────────────────────────────────────────

  describe('Step 3: Registry Recomposition on Config Change', () => {
    /**
     * When config changes without reloading modules,
     * the registry should be recomposed with existing module registries.
     */
    it('should recompose registry when config changes', () => {
      const mockModuleRegistry = createMockRegistry();

      // Initial state
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);

      const initialEffective = registryManager.getEffectiveRegistry();
      const initialButton = initialEffective.components['demo.button' as keyof typeof initialEffective.components];
      expect(initialButton?.displayName).toBe('Demo Button');

      // Config changes
      const newConfig: SkaffaConfig = {
        ...mockConfig,
        components: {
          overrides: {
            'demo.button': {
              displayName: 'Updated Button',
            },
          } as SkaffaConfig['components'],
        },
      };

      registryManager.recomposeWithConfig(newConfig);

      const updatedEffective = registryManager.getEffectiveRegistry();
      const updatedButton = updatedEffective.components['demo.button' as keyof typeof updatedEffective.components];

      // VERIFY: New config applied
      expect(updatedButton?.displayName).toBe('Updated Button');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Step 4: End-to-End - Extension Host Message Simulation
  // ─────────────────────────────────────────────────────────────────────────

  describe('Step 4: End-to-End Extension Host Message Handling', () => {
    /**
     * This test simulates the complete flow from extension host to InspectorStore.
     *
     * Flow:
     * 1. Extension host sends registry-contribution message
     * 2. ExtensionHostManager receives and calls registryManager.updateRegistry
     * 3. IPC handler registry:get returns the effective registry
     * 4. InspectorStore receives the registry
     */
    it('should handle registry contribution and serve via IPC', async () => {
      const mockModuleRegistry = createMockRegistry();

      // STEP 1: Simulate extension host message reception
      // This is what ExtensionHostManager.handleRegistryContribution does
      const message: RegistryContributionMessage = {
        type: 'registry-contribution',
        registries: [mockModuleRegistry],
      };

      // STEP 2: Registry manager receives the contribution
      registryManager.updateRegistry(message.registries, mockConfig);

      // STEP 3: Verify registry is now available
      const registry = registryManager.getEffectiveRegistry();

      expect(registry).not.toBeUndefined();
      expect(Object.keys(registry.components).length).toBeGreaterThan(0);

      // STEP 4: Simulate what the IPC handler would return
      // The handler calls registryManager.getEffectiveRegistry()
      const ipcResponse = { registry: registryManager.getEffectiveRegistry() };

      expect(ipcResponse.registry).toEqual(registry);
      expect(ipcResponse.registry.components['demo.button' as keyof typeof ipcResponse.registry.components]).toBeDefined();
    });

    /**
     * Test the timing issue: What happens if renderer requests registry
     * before extension host has contributed?
     *
     * This can happen during startup race conditions.
     */
    it('should return empty registry if queried before contributions arrive', () => {
      // No updateRegistry called - simulates slow extension host startup

      const registry = registryManager.getEffectiveRegistry();

      // VERIFY: Returns empty registry (not undefined)
      expect(registry).toBeDefined();
      expect(registry).toEqual(getEmptyRegistry());
      expect(Object.keys(registry.components)).toHaveLength(0);
    });

    /**
     * Registry should update when new contributions arrive.
     * This tests hot reload / module re-activation scenarios.
     */
    it('should update registry when new contributions arrive', () => {
      const mockModuleRegistry = createMockRegistry();

      // First contribution
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);

      const initialRegistry = registryManager.getEffectiveRegistry();
      expect(Object.keys(initialRegistry.components)).toHaveLength(2);

      // Second contribution (module reload or new module)
      const additionalRegistry: ComponentRegistry = {
        schemaVersion: 'v0',
        components: {
          'new.component': {
            displayName: 'New Component',
            props: {},
          },
        } as ComponentRegistry['components'],
      };

      registryManager.updateRegistry(
        [mockModuleRegistry, additionalRegistry],
        mockConfig
      );

      const updatedRegistry = registryManager.getEffectiveRegistry();

      // VERIFY: Registry includes new contributions
      expect(Object.keys(updatedRegistry.components)).toHaveLength(3);
      expect(updatedRegistry.components['new.component' as keyof typeof updatedRegistry.components]).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Failure Modes - Document Expected Behavior
  // ─────────────────────────────────────────────────────────────────────────

  describe('Failure Modes - Expected Behavior', () => {
    /**
     * If extension host never sends a registry-contribution,
     * the registry remains empty (not undefined).
     *
     * This is the symptom: "[InspectorStore] Loaded registry: undefined"
     * could indicate the IPC response is malformed, not just empty.
     */
    it('should never return undefined from getEffectiveRegistry', () => {
      // Never call updateRegistry

      const registry = registryManager.getEffectiveRegistry();

      // CRITICAL: Must be a valid registry object, not undefined
      expect(registry).toBeDefined();
      expect(registry).not.toBeNull();
      expect(registry).toHaveProperty('schemaVersion');
      expect(registry).toHaveProperty('components');
    });

    /**
     * Empty registries array should still produce a valid empty registry.
     */
    it('should handle empty registries array', () => {
      registryManager.updateRegistry([], mockConfig);

      const registry = registryManager.getEffectiveRegistry();

      expect(registry).toBeDefined();
      expect(registry.schemaVersion).toBe('v0');
      expect(Object.keys(registry.components)).toHaveLength(0);
    });
  });
});
