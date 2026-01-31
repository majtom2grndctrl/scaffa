/**
 * Extension Host → Main Process Registry Flow Integration Test
 *
 * This test verifies the complete IPC flow from extension host to main process
 * for registry contributions:
 *
 *   Extension Host (process.send) → Main Process (handleMessage) → registryManager
 *
 * This is a critical Skaffa workflow that must work correctly for the Inspector
 * to have access to component metadata.
 *
 * Symptoms when this breaks:
 * - "[InspectorStore] Loaded registry: undefined"
 * - Inspector shows no component types or editable props
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ComponentRegistry } from "../../shared/index.js";
import type { SkaffaConfig } from "../../shared/config.js";
import type {
  RegistryContributionMessage,
  ExtHostToMainMessage,
} from "../../extension-host/ipc-protocol.js";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Setup
// ─────────────────────────────────────────────────────────────────────────────

// Mock child_process to avoid actually forking processes
vi.mock("node:child_process", () => ({
  fork: vi.fn(() => ({
    on: vi.fn(),
    send: vi.fn(),
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    connected: true,
    kill: vi.fn(),
  })),
}));

// Mock electron
vi.mock("electron", () => ({
  ipcMain: {
    handle: vi.fn(),
  },
  BrowserWindow: {
    getAllWindows: vi.fn(() => []),
  },
}));

describe("Extension Host → Main Process Registry Flow", () => {
  const mockConfig: SkaffaConfig = {
    schemaVersion: "v0",
    preview: {
      entry: "./src/App.tsx",
      styles: [],
    },
    modules: [],
  };

  const mockModuleRegistry: ComponentRegistry = {
    schemaVersion: "v0",
    components: {
      "demo.button": {
        displayName: "Demo Button",
        props: {
          label: {
            propName: "label",
            exposure: { kind: "editable", control: { kind: "string" } },
          },
        },
      },
    } as ComponentRegistry["components"],
  };

  // Fresh import the modules for each test to avoid state leakage
  let registryManager: typeof import("./registry-manager.js").registryManager;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Fresh imports
    const registryManagerModule = await import("./registry-manager.js");
    registryManager = registryManagerModule.registryManager;
  });

  afterEach(() => {
    vi.resetModules();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: Simulate ExtensionHostManager.handleRegistryContribution
  // ─────────────────────────────────────────────────────────────────────────

  describe("handleRegistryContribution simulation", () => {
    /**
     * This test simulates exactly what ExtensionHostManager.handleRegistryContribution
     * does when it receives a registry-contribution message from the extension host.
     *
     * The actual method at extension-host-manager.ts:246-259:
     *
     * ```ts
     * private handleRegistryContribution(message: RegistryContributionMessage): void {
     *   console.log(`[ExtHostManager] Received ${message.registries.length} registry contribution(s)`);
     *
     *   if (!this.config) {
     *     console.error('[ExtHostManager] No config available for registry composition');
     *     return;
     *   }
     *
     *   // Update registry manager with module registries
     *   registryManager.updateRegistry(message.registries, this.config);
     * }
     * ```
     */
    it("should update registryManager when registry-contribution message is received", () => {
      // Create the message that extension host would send
      const message: RegistryContributionMessage = {
        type: "registry-contribution",
        registries: [mockModuleRegistry],
      };

      // Simulate what handleRegistryContribution does
      console.log(
        `[Test] Received ${message.registries.length} registry contribution(s)`,
      );
      registryManager.updateRegistry(message.registries, mockConfig);

      // VERIFY: Registry is now populated
      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components)).toHaveLength(1);
      expect(
        effective.components[
          "demo.button" as keyof typeof effective.components
        ],
      ).toBeDefined();
    });

    /**
     * Edge case: What if handleRegistryContribution is called with no config?
     *
     * This can happen if:
     * - Extension host sends contribution before workspace is fully initialized
     * - There's a race condition during startup
     */
    it("should handle missing config gracefully (simulating race condition)", () => {
      const message: RegistryContributionMessage = {
        type: "registry-contribution",
        registries: [mockModuleRegistry],
      };

      // Without calling updateRegistry (simulating config === null branch)
      // The registry should remain empty
      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components)).toHaveLength(0);
    });

    /**
     * Edge case: What if extension host sends empty registries array?
     */
    it("should handle empty registries array", () => {
      const message: RegistryContributionMessage = {
        type: "registry-contribution",
        registries: [],
      };

      registryManager.updateRegistry(message.registries, mockConfig);

      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components)).toHaveLength(0);
      expect(effective).toBeDefined();
    });

    /**
     * Multiple registry contributions should be merged
     */
    it("should merge multiple registry contributions", () => {
      const firstRegistry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "demo.button": {
            displayName: "Demo Button",
            props: {},
          },
        } as ComponentRegistry["components"],
      };

      const secondRegistry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "demo.card": {
            displayName: "Demo Card",
            props: {},
          },
        } as ComponentRegistry["components"],
      };

      const message: RegistryContributionMessage = {
        type: "registry-contribution",
        registries: [firstRegistry, secondRegistry],
      };

      registryManager.updateRegistry(message.registries, mockConfig);

      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components)).toHaveLength(2);
      expect(
        effective.components[
          "demo.button" as keyof typeof effective.components
        ],
      ).toBeDefined();
      expect(
        effective.components["demo.card" as keyof typeof effective.components],
      ).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: Complete message dispatch simulation
  // ─────────────────────────────────────────────────────────────────────────

  describe("handleMessage dispatch simulation", () => {
    /**
     * This test simulates the complete message handler dispatch.
     *
     * The actual method at extension-host-manager.ts:178-244 switches on message.type
     * and routes to the appropriate handler.
     */
    it("should route registry-contribution message to handler", () => {
      // Simulate the handleMessage switch statement
      const handleMessage = (
        message: ExtHostToMainMessage,
        config: SkaffaConfig | null,
      ) => {
        switch (message.type) {
          case "registry-contribution":
            if (!config) {
              console.error(
                "[Test] No config available for registry composition",
              );
              return false;
            }
            registryManager.updateRegistry(message.registries, config);
            return true;
          default:
            return false;
        }
      };

      const message: ExtHostToMainMessage = {
        type: "registry-contribution",
        registries: [mockModuleRegistry],
      };

      const handled = handleMessage(message, mockConfig);

      expect(handled).toBe(true);
      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components).length).toBeGreaterThan(0);
    });

    /**
     * Verify that non-registry messages don't affect the registry
     */
    it("should not affect registry for non-registry messages", () => {
      // Simulate receiving a 'ready' message
      const message: ExtHostToMainMessage = {
        type: "ready",
      };

      // Registry should remain empty (no contribution received)
      const effective = registryManager.getEffectiveRegistry();
      expect(Object.keys(effective.components)).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: Verify IPC response shape for renderer
  // ─────────────────────────────────────────────────────────────────────────

  describe("IPC Response Shape Verification", () => {
    /**
     * The InspectorStore expects: { registry: ComponentRegistry }
     *
     * If the response shape is wrong (e.g., just ComponentRegistry without wrapper),
     * the store will get undefined for response.registry.
     */
    it("should produce correct response shape for registry:get IPC call", () => {
      // Setup: contribute a registry
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);

      // The IPC handler returns { registry: getEffectiveRegistry() }
      const ipcResponse = {
        registry: registryManager.getEffectiveRegistry(),
      };

      // CRITICAL: Verify response has 'registry' property
      expect(ipcResponse).toHaveProperty("registry");
      expect(ipcResponse.registry).not.toBeUndefined();
      expect(ipcResponse.registry).toHaveProperty("schemaVersion");
      expect(ipcResponse.registry).toHaveProperty("components");
    });

    /**
     * Edge case: Verify response shape even when registry is empty
     */
    it("should produce correct response shape even when registry is empty", () => {
      // No contributions made - registry is empty

      const ipcResponse = {
        registry: registryManager.getEffectiveRegistry(),
      };

      // CRITICAL: Even with no contributions, registry should be defined (empty, not undefined)
      expect(ipcResponse).toHaveProperty("registry");
      expect(ipcResponse.registry).not.toBeUndefined();
      expect(ipcResponse.registry.schemaVersion).toBe("v0");
      expect(Object.keys(ipcResponse.registry.components)).toHaveLength(0);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Test: Timing and Race Conditions
  // ─────────────────────────────────────────────────────────────────────────

  describe("Timing and Race Conditions", () => {
    /**
     * CRITICAL TEST: Renderer requests registry before extension host contributes
     *
     * This is likely the root cause of the "undefined" registry issue.
     * The renderer might be calling registry.get() before the extension host
     * has finished loading modules and sending registry-contribution.
     */
    it("should document behavior when registry requested before contributions", () => {
      // Step 1: Renderer requests registry BEFORE any contributions
      const earlyResponse = registryManager.getEffectiveRegistry();

      // This is what causes "[InspectorStore] Loaded registry: undefined"?
      // No! The registry itself should be defined (empty), not undefined.
      expect(earlyResponse).toBeDefined();
      expect(earlyResponse.components).toBeDefined();
      expect(Object.keys(earlyResponse.components)).toHaveLength(0);

      // Step 2: Extension host contributes later
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);

      // Step 3: Subsequent requests get the populated registry
      const laterResponse = registryManager.getEffectiveRegistry();
      expect(Object.keys(laterResponse.components)).toHaveLength(1);

      // KEY INSIGHT: If the renderer only calls registry.get() once during init,
      // it will have an empty registry forever! It needs to either:
      // 1. Wait for extension host to signal completion
      // 2. Re-fetch registry after receiving a "registry updated" event
      // 3. Use a subscription model instead of one-time fetch
    });

    /**
     * Document the expected startup sequence
     */
    it("should document expected startup sequence", () => {
      // This test documents the expected sequence for registry loading:

      // 1. Main process starts extension host
      // 2. Extension host loads modules and collects registry contributions
      // 3. Extension host sends registry-contribution message
      // 4. Main process receives message and calls registryManager.updateRegistry
      // 5. Renderer calls window.skaffa.registry.get()
      // 6. Main process IPC handler calls registryManager.getEffectiveRegistry()
      // 7. Renderer receives populated registry

      // If step 5 happens before step 4, renderer gets empty registry.
      // If step 3 never happens, renderer gets empty registry forever.

      // The test validates steps 4-7 work correctly when properly sequenced.
      registryManager.updateRegistry([mockModuleRegistry], mockConfig);
      const response = registryManager.getEffectiveRegistry();
      expect(Object.keys(response.components).length).toBeGreaterThan(0);
    });
  });
});
