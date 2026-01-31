import { describe, it, expect, vi } from "vitest";
import type { SkaffaConfig } from "../shared/config.js";
import { ModuleLoader } from "./module-loader.js";

describe("Extension Host Activation", () => {
  it("should load and activate a valid extension module", async () => {
    // Mock process.send
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    // Create a config pointing to a local fixture module
    const config: SkaffaConfig = {
      schemaVersion: "v0",
      modules: [
        {
          id: "test-extension",
          path: "src/extension-host/__fixtures__/test-extension.ts",
        },
      ],
    };

    const loader = new ModuleLoader(process.cwd(), config);

    // Note: This test actually loads the real extension since we can't easily mock dynamic imports
    // For true unit test isolation, we'd need dependency injection for the import system
    // This test validates that:
    // 1. The module loader can process a config
    // 2. Module discovery works
    // 3. Activation lifecycle executes

    try {
      await loader.loadAndActivateModules();

      // Verify process.send was called (module communications)
      expect(mockSend).toHaveBeenCalled();

      // Check for registry contribution from the fixture module
      const messages = mockSend.mock.calls.map((call) => call[0]);
      const registryMessage = messages.find(
        (msg: any) => msg.type === "registry-contribution",
      );
      expect(registryMessage).toBeDefined();
      expect(registryMessage?.registries?.[0]?.components).toHaveProperty(
        "test.component",
      );
    } finally {
      // Cleanup
      process.send = originalSend;
    }
  });

  it("should handle module load failures gracefully", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    const config: SkaffaConfig = {
      schemaVersion: "v0",
      modules: [
        {
          id: "nonexistent-module",
          path: "does/not/exist.ts",
        },
      ],
    };

    const loader = new ModuleLoader(
      "/Users/dhiester/Projects/Personal/skaffa",
      config,
    );

    await loader.loadAndActivateModules();

    // Should have sent failure status
    const messages = mockSend.mock.calls.map((call) => call[0]);
    const failureMessage = messages.find(
      (msg: any) =>
        msg.type === "module-activation-status" && msg.status === "failed",
    );

    expect(failureMessage).toBeDefined();
    expect(failureMessage?.error).toBeDefined();

    process.send = originalSend;
    errorSpy.mockRestore();
  });

  it("should support workspace config with extensions/*/module pattern", () => {
    const config: SkaffaConfig = {
      schemaVersion: "v0",
      modules: [
        {
          id: "mui-registry",
          path: "extensions/mui-registry/module/index.ts",
        },
      ],
    };

    // Verify config structure matches expected pattern
    expect(config.modules).toHaveLength(1);
    expect(config.modules?.[0].path).toMatch(
      /^extensions\/[^/]+\/module\/index\.ts$/,
    );
  });

  it("should reject path traversal attempts", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    const config: SkaffaConfig = {
      schemaVersion: "v0",
      modules: [
        {
          id: "malicious-module",
          path: "../../../etc/passwd",
        },
      ],
    };

    const loader = new ModuleLoader(process.cwd(), config);

    await loader.loadAndActivateModules();

    // Should have failed with path resolution error
    const messages = mockSend.mock.calls.map((call) => call[0]);
    const failureMessage = messages.find(
      (msg: any) =>
        msg.type === "module-activation-status" && msg.status === "failed",
    );

    expect(failureMessage).toBeDefined();
    expect(failureMessage?.error?.message).toContain(
      "Cannot resolve module path",
    );

    // Should have logged security warning
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Module path escapes workspace"),
    );

    process.send = originalSend;
    errorSpy.mockRestore();
  });

  it("should allow workspace-anchored prefixes within workspace", async () => {
    const mockSend = vi.fn();
    const originalSend = process.send;
    process.send = mockSend as any;

    const config: SkaffaConfig = {
      schemaVersion: "v0",
      modules: [
        {
          id: "test-module-at",
          path: "@/extensions/sample-module/index.js",
        },
        {
          id: "test-module-workspace",
          path: "workspace:/extensions/sample-module/index.js",
        },
      ],
    };

    const loader = new ModuleLoader(process.cwd(), config);

    // Note: These will fail to load because the files don't exist,
    // but they should pass path validation and attempt to import
    await loader.loadAndActivateModules();

    const messages = mockSend.mock.calls.map((call) => call[0]);
    const failures = messages.filter(
      (msg: any) =>
        msg.type === "module-activation-status" && msg.status === "failed",
    );

    // Both should fail due to file not found, not path validation
    expect(failures).toHaveLength(2);
    failures.forEach((msg: any) => {
      expect(msg.error.message).not.toContain("Cannot resolve module path");
    });

    process.send = originalSend;
  });
});
