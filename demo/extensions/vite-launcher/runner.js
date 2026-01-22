// ─────────────────────────────────────────────────────────────────────────────
// Vite Runner (v0) - Registry-Driven Instrumentation
// ─────────────────────────────────────────────────────────────────────────────
// This script runs in a separate process to manage the Vite dev server.
// It uses the PROJECT'S installed Vite version.
//
// KEY FEATURE: Registry-driven instrumentation
// - Builds an allowlist from ComponentImplementationHint in the registry
// - Instruments matched files with adapter boundaries (ScaffaInstanceBoundary)
// - Passes componentTypeId to the wrapper; adapter owns instanceId
// - Handles optimizeDeps.exclude for package hints
//
// See: docs/scaffa_harness_model.md (5.4-5.6)
//      docs/scaffa_component_registry_schema.md (5.1/5.2)
//      docs/scaffa_runtime_adapter_integration_guide.md (2.2.1/2.2.2)
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import path from "node:path";
import fs from "node:fs";

var require2 = createRequire(import.meta.url);

// ─────────────────────────────────────────────────────────────────────────────
// Instrumentation Matcher Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolved matcher for a single component type.
 * @typedef {Object} InstrumentationMatcher
 * @property {string} typeId - Component type ID from registry
 * @property {string} resolvedModuleId - Absolute path or resolved specifier
 * @property {string} exportName - Export name to wrap (defaults to "default")
 * @property {"file"|"package"} kind - Source kind
 */

/**
 * Build instrumentation matchers from registry implementation hints.
 * @param {Object} registry - Component registry snapshot
 * @param {string} workspaceRoot - Absolute path to workspace root
 * @returns {{ matchers: InstrumentationMatcher[], packageExcludes: string[] }}
 */
function buildInstrumentationMatchers(registry, workspaceRoot) {
  const matchers = [];
  const packageExcludes = new Set();

  if (!registry?.components) {
    console.log("[ViteRunner] No registry components to instrument");
    return { matchers: [], packageExcludes: [] };
  }

  for (const [typeId, entry] of Object.entries(registry.components)) {
    const hints = entry.implementation;
    if (!hints) continue;

    // Normalize to array (implementation can be single or array)
    const hintsArray = Array.isArray(hints) ? hints : [hints];

    for (const hint of hintsArray) {
      if (hint.kind === "file") {
        // Resolve workspace-relative path to absolute path
        const resolvedPath = path.resolve(workspaceRoot, hint.filePath);
        const exportName = hint.exportName || "default";

        matchers.push({
          typeId,
          resolvedModuleId: resolvedPath,
          exportName,
          kind: "file",
        });

        console.log(`[ViteRunner] Matcher: ${typeId} -> ${resolvedPath}#${exportName}`);
      } else if (hint.kind === "package") {
        // For package hints, we need to:
        // 1. Add to optimizeDeps.exclude so transform runs on the dependency
        // 2. Match the resolved module id
        const specifier = hint.specifier;
        const exportName = hint.exportName || "default";

        // Add base package to excludes (e.g. "@mui/material" from "@mui/material/Button")
        const basePkg = getBasePackageName(specifier);
        packageExcludes.add(basePkg);

        matchers.push({
          typeId,
          resolvedModuleId: specifier, // Will be matched against resolved id
          exportName,
          kind: "package",
        });

        console.log(`[ViteRunner] Matcher (pkg): ${typeId} -> ${specifier}#${exportName}`);
      }
    }
  }

  console.log(`[ViteRunner] Built ${matchers.length} instrumentation matcher(s), ${packageExcludes.size} package exclude(s)`);
  return { matchers, packageExcludes: Array.from(packageExcludes) };
}

/**
 * Get base package name from a specifier.
 * e.g. "@mui/material/Button" -> "@mui/material"
 * e.g. "lodash/debounce" -> "lodash"
 */
function getBasePackageName(specifier) {
  if (specifier.startsWith("@")) {
    // Scoped package: @scope/name/subpath -> @scope/name
    const parts = specifier.split("/");
    return parts.slice(0, 2).join("/");
  }
  // Unscoped package: name/subpath -> name
  return specifier.split("/")[0];
}

/**
 * Find a matcher for a given module id.
 * @param {string} moduleId - The resolved module id from Vite
 * @param {InstrumentationMatcher[]} matchers - The list of matchers
 * @returns {InstrumentationMatcher|null}
 */
function findMatcher(moduleId, matchers) {
  for (const matcher of matchers) {
    if (matcher.kind === "file") {
      // Exact match for file paths
      if (moduleId === matcher.resolvedModuleId) {
        return matcher;
      }
      // Also check with extensions
      const extensions = [".tsx", ".ts", ".jsx", ".js"];
      for (const ext of extensions) {
        if (moduleId === matcher.resolvedModuleId + ext) {
          return matcher;
        }
      }
    } else if (matcher.kind === "package") {
      // For package specifiers, check if moduleId contains the specifier
      // This handles cases where Vite resolves "@mui/material/Button" to a full path
      if (moduleId.includes("node_modules")) {
        const specifierParts = matcher.resolvedModuleId.split("/");
        const matchPattern = specifierParts.join(path.sep);
        if (moduleId.includes(matchPattern)) {
          return matcher;
        }
      }
    }
  }
  return null;
}

/**
 * Create the Vite plugin for registry-driven instrumentation.
 * @param {InstrumentationMatcher[]} matchers - The list of matchers
 * @returns {Object} Vite plugin
 */
function createInstrumentationPlugin(matchers) {
  return {
    name: "scaffa:instrumentation",
    async transform(code, id) {
      // Skip node_modules (handled by optimizeDeps for needed packages)
      // Also skip virtual modules
      if (id.includes("node_modules") || id.startsWith("\0")) {
        return null;
      }

      const matcher = findMatcher(id, matchers);
      if (!matcher) {
        return null;
      }

      console.log(`[ViteRunner] Instrumenting: ${id} -> ${matcher.typeId}#${matcher.exportName}`);

      // Generate wrapper code
      // The wrapper provides componentTypeId to the adapter's ScaffaInstanceBoundary
      // Adapter owns instanceId generation
      const wrappedCode = wrapExportWithBoundary(code, matcher.typeId, matcher.exportName, id);

      return {
        code: wrappedCode,
        map: null, // TODO: generate source map for better debugging
      };
    },
  };
}

/**
 * Wrap a component export with ScaffaInstanceBoundary.
 * This injects the componentTypeId into the runtime.
 * 
 * @param {string} code - Original module code
 * @param {string} typeId - Component type ID from registry
 * @param {string} exportName - Export name to wrap
 * @param {string} moduleId - Module id for debugging
 * @returns {string} - Transformed code
 */
function wrapExportWithBoundary(code, typeId, exportName, moduleId) {
  // Detect export patterns and wrap appropriately
  // This handles:
  // 1. export default function/class Component
  // 2. export default Component
  // 3. export function Component / export class Component
  // 4. export { Component }

  const isDefaultExport = exportName === "default";

  if (isDefaultExport) {
    // Check for "export default function" or "export default class"
    const defaultFuncMatch = code.match(/export\s+default\s+(function|class)\s+(\w+)?/);
    if (defaultFuncMatch) {
      const keyword = defaultFuncMatch[1];
      const name = defaultFuncMatch[2] || "_ScaffaWrappedComponent";

      // Replace export default with wrapped version
      const wrappedExport = `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+(function|class)/, `const ${name} = $1`)}

export default _ScaffaInstanceBoundary(${name}, ${JSON.stringify(typeId)});
`;
      return wrappedExport;
    }

    // Check for "export default <identifier>" or "export default <expression>"
    const defaultExprMatch = code.match(/export\s+default\s+(\w+)\s*;?/);
    if (defaultExprMatch) {
      const identifier = defaultExprMatch[1];

      // Wrap the existing default export
      const wrappedExport = `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+\w+\s*;?/, "")}

const _OriginalComponent = ${identifier};
export default _ScaffaInstanceBoundary(_OriginalComponent, ${JSON.stringify(typeId)});
`;
      return wrappedExport;
    }
  } else {
    // Named export wrapping
    // Check for "export function Name" or "export class Name"
    const namedFuncPattern = new RegExp(`export\\s+(function|class)\\s+${exportName}\\b`);
    const namedFuncMatch = code.match(namedFuncPattern);

    if (namedFuncMatch) {
      const keyword = namedFuncMatch[1];
      const originalName = `_Original${exportName}`;
      const wrappedName = `_ScaffaWrapped${exportName}`;

      // Preserve hoisting for function exports by keeping the exported binding as a function.
      // This avoids TDZ errors if an imported binding is accessed early in a cycle.
      const wrappedExport = `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';
import { createElement as _ScaffaCreateElement } from 'react';

${code.replace(namedFuncPattern, `${keyword} ${originalName}`)}

const ${wrappedName} = _ScaffaInstanceBoundary(${originalName}, ${JSON.stringify(typeId)});
export function ${exportName}(props) {
  return _ScaffaCreateElement(${wrappedName}, props);
}
`;
      return wrappedExport;
    }

    // Check for "export { Name }" or "export { something as Name }"
    const namedExportPattern = new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`);
    if (namedExportPattern.test(code)) {
      console.warn(`[ViteRunner] Warning: Cannot wrap re-export "${exportName}" in ${moduleId}; skipping instrumentation`);
      return code;
    }
  }

  // If we couldn't match a pattern, log a warning and return original
  console.warn(`[ViteRunner] Warning: Could not find export "${exportName}" in ${moduleId} for typeId=${typeId}; skipping instrumentation`);
  return code;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Runner
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  // SCAFFA_ROOT is the app directory where Vite runs
  const appRoot = process.env.SCAFFA_ROOT || process.cwd();
  // SCAFFA_WORKSPACE_ROOT is where scaffa.config.js lives - used for resolving implementation hints
  // Implementation hints in registry are relative to the workspace root, not the app directory
  const workspaceRoot = process.env.SCAFFA_WORKSPACE_ROOT || appRoot;
  const entry = process.env.SCAFFA_ENTRY;
  const styles = JSON.parse(process.env.SCAFFA_STYLES || "[]");
  const registry = JSON.parse(process.env.SCAFFA_REGISTRY || "{}");

  if (!entry) {
    console.error("[ViteRunner] Error: SCAFFA_ENTRY not set");
    process.exit(1);
  }

  console.log("[ViteRunner] Starting with config:", { entry, styles, appRoot, workspaceRoot });
  console.log("[ViteRunner] Registry has", Object.keys(registry.components || {}).length, "component(s)");

  const toRelative = (absPath) => {
    if (absPath.startsWith(appRoot)) {
      return "." + absPath.slice(appRoot.length);
    }
    return absPath;
  };

  const relativeEntry = toRelative(entry);
  const relativeStyles = styles.map(toRelative);
  console.log("[ViteRunner] Relative paths:", { entry: relativeEntry, styles: relativeStyles });

  // Build instrumentation matchers from registry
  // NOTE: Use workspaceRoot here because implementation hints are relative to where scaffa.config.js lives
  const { matchers, packageExcludes } = buildInstrumentationMatchers(registry, workspaceRoot);

  // Generate harness content
  const harnessContent = `// AUTO-GENERATED by Scaffa - do not edit
// This file is the entrypoint for Scaffa's preview mode
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ScaffaProvider } from '@scaffa/react-runtime-adapter';

// User Styles
${relativeStyles.map((s) => `import ${JSON.stringify(s)};`).join("\n")}

// User Entry (App.tsx contains the Router)
import * as UserEntry from ${JSON.stringify(relativeEntry)};
const App = UserEntry.App || UserEntry.default;

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ScaffaProvider
      config={{
        adapterId: 'react',
        adapterVersion: '0.1.0',
        debug: true,
      }}
    >
      {App ? <App /> : <div style={{color: 'red', padding: '20px'}}>Error: No App or default export found in ${JSON.stringify(relativeEntry)}</div>}
    </ScaffaProvider>
  </React.StrictMode>
);
`;

  try {
    // Write harness file to app root (Vite serves files from root more reliably)
    const harnessPath = path.join(appRoot, ".scaffa-harness.tsx");
    fs.writeFileSync(harnessPath, harnessContent, "utf-8");
    console.log("[ViteRunner] Wrote harness file:", harnessPath);

    const cleanup = () => {
      try {
        if (fs.existsSync(harnessPath)) {
          fs.unlinkSync(harnessPath);
          console.log("[ViteRunner] Cleaned up harness file");
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
    process.on("exit", cleanup);
    process.on("SIGINT", () => {
      cleanup();
      process.exit();
    });
    process.on("SIGTERM", () => {
      cleanup();
      process.exit();
    });

    // Resolve Vite from app directory
    const vitePath = require2.resolve("vite", { paths: [appRoot] });
    const viteModule = await import(pathToFileURL(vitePath).href);
    const vite = viteModule.default || viteModule;

    const projectConfig = await vite.loadConfigFromFile(
      { command: "serve", mode: "development" },
      void 0,
      appRoot
    );

    const harnessPlugin = {
      name: "scaffa:harness",
      transformIndexHtml(html) {
        const harnessSrc = "/.scaffa-harness.tsx";
        const scriptRegex = /<script\s+type="module"\s+src="([^"]+)"><\/script>/g;
        let replacedSrc = null;
        const nextHtml = html.replace(scriptRegex, (match, src) => {
          if (replacedSrc) {
            return match;
          }
          if (src.includes("/@vite/client")) {
            return match;
          }
          replacedSrc = src;
          return `<script type="module" src="${harnessSrc}"></script>`;
        });

        if (replacedSrc) {
          console.log("[ViteRunner] transformIndexHtml replacing:", replacedSrc);
          return nextHtml;
        }

        console.log("[ViteRunner] transformIndexHtml: no entry script found");
        return html;
      }
    };

    const randomPort = 3100 + Math.floor(Math.random() * 900);

    // Build optimizeDeps config
    // Include standard deps and exclude packages that need instrumentation
    const optimizeDepsConfig = {
      include: ["react", "react-dom/client", "@scaffa/react-runtime-adapter"],
    };

    // Add package excludes for instrumentation
    // This ensures transforms run on these dependencies
    // See: docs/scaffa_component_registry_schema.md (5.1 note on optimizeDeps)
    if (packageExcludes.length > 0) {
      optimizeDepsConfig.exclude = packageExcludes;
      console.log("[ViteRunner] optimizeDeps.exclude:", packageExcludes);
    }

    const myConfig = {
      // Vite runs in the app directory
      root: appRoot,
      server: {
        port: randomPort,
        strictPort: false
      },
      optimizeDeps: optimizeDepsConfig,
    };

    const baseConfig = projectConfig?.config || {};
    const rawPlugins = Array.isArray(baseConfig.plugins) ? baseConfig.plugins : [];
    const allProjectPlugins = rawPlugins.flat(2).filter(Boolean);
    const projectPlugins = allProjectPlugins.filter(
      (p) => p?.name !== "vite:react-refresh" && p?.name !== "vite:react-babel"
    );
    console.log("[ViteRunner] Plugin info:", {
      allPlugins: allProjectPlugins.map((p) => p?.name).filter(Boolean),
      afterFilter: projectPlugins.map((p) => p?.name).filter(Boolean)
    });

    const jsxPlugin = {
      name: "scaffa:jsx",
      async transform(code, id) {
        if (!/\.(jsx|tsx)$/.test(id)) return null;
        if (id.includes("node_modules")) return null;

        // Debug log for virtual harness
        if (id.includes("scaffa-harness")) {
          console.log("[ViteRunner] JSX plugin transforming virtual harness:", id);
        }

        const result = await vite.transformWithEsbuild(code, id, {
          loader: id.endsWith(".tsx") ? "tsx" : "jsx",
          jsx: "automatic",
          jsxImportSource: "react"
        });
        return {
          code: result.code,
          map: result.map
        };
      }
    };

    // Create instrumentation plugin if we have matchers
    const instrumentationPlugin = matchers.length > 0
      ? createInstrumentationPlugin(matchers)
      : null;

    // Build final plugin list
    // Order: project plugins, instrumentation, jsx, harness
    const mergedPlugins = [
      ...projectPlugins,
      ...(instrumentationPlugin ? [instrumentationPlugin] : []),
      jsxPlugin,
      harnessPlugin,
    ];

    const { plugins: _, ...baseWithoutPlugins } = baseConfig;
    const finalConfig = vite.mergeConfig(baseWithoutPlugins, {
      ...myConfig,
      plugins: mergedPlugins
    });

    console.log("[ViteRunner] Starting Vite server...");
    const server = await vite.createServer(finalConfig);
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : 0;
    console.log(`Local: http://localhost:${port}`);
    await new Promise(() => { });
  } catch (error) {
    console.error("[ViteRunner] Failed to start:", error);
    process.exit(1);
  }
}

main();
