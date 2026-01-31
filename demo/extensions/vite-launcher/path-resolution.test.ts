// ─────────────────────────────────────────────────────────────────────────────
// Vite Launcher Instrumentation Path Resolution Tests
// ─────────────────────────────────────────────────────────────────────────────
// Tests the path resolution logic for registry implementation hints in the
// vite-launcher instrumentation flow.
//
// Key invariant: implementation hints are relative to the WORKSPACE ROOT
// (where skaffa.config.js lives), not the app directory (where Vite runs).
//
// See: docs/skaffa_harness_model.md (5.4-5.6)
//      docs/skaffa_component_registry_schema.md (5.1)

import { describe, it, expect } from "vitest";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Path Resolution Logic (extracted from runner.js for testing)
// ─────────────────────────────────────────────────────────────────────────────

interface InstrumentationMatcher {
  typeId: string;
  resolvedModuleId: string;
  exportName: string;
  kind: "file" | "package";
}

interface ImplementationHint {
  kind: "file" | "package";
  filePath?: string;
  specifier?: string;
  exportName?: string;
}

interface ComponentEntry {
  typeId: string;
  implementation?: ImplementationHint | ImplementationHint[];
}

interface ComponentRegistry {
  schemaVersion: string;
  components: Record<string, ComponentEntry>;
}

/**
 * Build instrumentation matchers from registry implementation hints.
 * This is the same logic as runner.js, extracted for testing.
 */
function buildInstrumentationMatchers(
  registry: ComponentRegistry,
  workspaceRoot: string,
): { matchers: InstrumentationMatcher[]; packageExcludes: string[] } {
  const matchers: InstrumentationMatcher[] = [];
  const packageExcludes = new Set<string>();

  if (!registry?.components) {
    return { matchers: [], packageExcludes: [] };
  }

  for (const [typeId, entry] of Object.entries(registry.components)) {
    const hints = entry.implementation;
    if (!hints) continue;

    const hintsArray = Array.isArray(hints) ? hints : [hints];

    for (const hint of hintsArray) {
      if (hint.kind === "file" && hint.filePath) {
        // Resolve workspace-relative path to absolute path
        const resolvedPath = path.resolve(workspaceRoot, hint.filePath);
        const exportName = hint.exportName || "default";

        matchers.push({
          typeId,
          resolvedModuleId: resolvedPath,
          exportName,
          kind: "file",
        });
      } else if (hint.kind === "package" && hint.specifier) {
        const specifier = hint.specifier;
        const exportName = hint.exportName || "default";

        const basePkg = getBasePackageName(specifier);
        packageExcludes.add(basePkg);

        matchers.push({
          typeId,
          resolvedModuleId: specifier,
          exportName,
          kind: "package",
        });
      }
    }
  }

  return { matchers, packageExcludes: Array.from(packageExcludes) };
}

function getBasePackageName(specifier: string): string {
  if (specifier.startsWith("@")) {
    const parts = specifier.split("/");
    return parts.slice(0, 2).join("/");
  }
  return specifier.split("/")[0];
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("Vite Launcher Instrumentation Path Resolution", () => {
  describe("buildInstrumentationMatchers", () => {
    it("resolves file implementation hints relative to workspace root", () => {
      // This is the critical invariant: file paths are relative to where skaffa.config.js lives,
      // NOT where the app or Vite dev server runs
      const workspaceRoot = "/Users/test/my-project";
      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "ui.button": {
            typeId: "ui.button",
            implementation: {
              kind: "file",
              filePath: "app/src/components/Button.tsx",
              exportName: "Button",
            },
          },
        },
      };

      const { matchers } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(1);
      expect(matchers[0]).toEqual({
        typeId: "ui.button",
        resolvedModuleId:
          "/Users/test/my-project/app/src/components/Button.tsx",
        exportName: "Button",
        kind: "file",
      });
    });

    it("does NOT double-nest paths when app is a subdirectory", () => {
      // BUG SCENARIO: If we incorrectly use appRoot (demo/app) instead of workspaceRoot (demo),
      // this would produce: /demo/app/app/src/components/Button.tsx (WRONG!)
      const workspaceRoot = "/Users/test/skaffa/demo";
      const _appRoot = "/Users/test/skaffa/demo/app"; // This should NOT be used for path resolution

      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "demo.button": {
            typeId: "demo.button",
            implementation: {
              kind: "file",
              filePath: "app/src/components/DemoButton.tsx",
              exportName: "DemoButton",
            },
          },
        },
      };

      const { matchers } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(1);
      // Path should be correctly resolved from workspace root
      expect(matchers[0].resolvedModuleId).toBe(
        "/Users/test/skaffa/demo/app/src/components/DemoButton.tsx",
      );
      // NOT this wrong path:
      expect(matchers[0].resolvedModuleId).not.toContain("/app/app/");
    });

    it("handles package implementation hints for external libraries", () => {
      const workspaceRoot = "/Users/test/my-project";
      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "mui.button": {
            typeId: "mui.button",
            implementation: {
              kind: "package",
              specifier: "@mui/material/Button",
              exportName: "default",
            },
          },
        },
      };

      const { matchers, packageExcludes } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(1);
      expect(matchers[0]).toEqual({
        typeId: "mui.button",
        resolvedModuleId: "@mui/material/Button",
        exportName: "default",
        kind: "package",
      });

      // Base package should be excluded from optimizeDeps for instrumentation
      expect(packageExcludes).toContain("@mui/material");
    });

    it("handles multiple implementation hints for a single component", () => {
      const workspaceRoot = "/Users/test/my-project";
      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "ui.button": {
            typeId: "ui.button",
            implementation: [
              {
                kind: "file",
                filePath: "src/components/Button.tsx",
                exportName: "Button",
              },
              {
                kind: "file",
                filePath: "src/legacy/Button.tsx",
                exportName: "default",
              },
            ],
          },
        },
      };

      const { matchers } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(2);
      expect(matchers[0].resolvedModuleId).toBe(
        "/Users/test/my-project/src/components/Button.tsx",
      );
      expect(matchers[1].resolvedModuleId).toBe(
        "/Users/test/my-project/src/legacy/Button.tsx",
      );
    });

    it("returns empty matchers when registry has no components", () => {
      const workspaceRoot = "/Users/test/my-project";
      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {},
      };

      const { matchers, packageExcludes } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(0);
      expect(packageExcludes).toHaveLength(0);
    });

    it("skips components without implementation hints", () => {
      const workspaceRoot = "/Users/test/my-project";
      const registry: ComponentRegistry = {
        schemaVersion: "v0",
        components: {
          "ui.text": {
            typeId: "ui.text",
            // No implementation hint - this component is not instrumentable
          },
          "ui.button": {
            typeId: "ui.button",
            implementation: {
              kind: "file",
              filePath: "src/Button.tsx",
              exportName: "Button",
            },
          },
        },
      };

      const { matchers } = buildInstrumentationMatchers(
        registry,
        workspaceRoot,
      );

      expect(matchers).toHaveLength(1);
      expect(matchers[0].typeId).toBe("ui.button");
    });
  });

  describe("getBasePackageName", () => {
    it("extracts base package from scoped package paths", () => {
      expect(getBasePackageName("@mui/material/Button")).toBe("@mui/material");
      expect(getBasePackageName("@radix-ui/react-dialog")).toBe(
        "@radix-ui/react-dialog",
      );
      expect(getBasePackageName("@scope/pkg/deeply/nested")).toBe("@scope/pkg");
    });

    it("extracts base package from unscoped package paths", () => {
      expect(getBasePackageName("lodash/debounce")).toBe("lodash");
      expect(getBasePackageName("react-router-dom/hooks")).toBe(
        "react-router-dom",
      );
      expect(getBasePackageName("uuid")).toBe("uuid");
    });
  });
});
