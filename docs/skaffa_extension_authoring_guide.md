# Skaffa Extension Authoring Guide (v0)

> **Status:** Draft / v0 guide  
> **Audience:** Module and extension authors (first‑party and internal)  
> **Goal:** Document how to author Skaffa extensions against the current v0 Extension Context, with clear process boundaries, type import conventions, and debugging guidance.

Related:
- [Architecture Plan](./index.md)
- [Skaffa Extension API – v0 Sketch](./skaffa_extension_api.md)
- [IPC Boundaries + Key Sequence Diagrams](./skaffa_ipc_boundaries_and_sequences.md)
- [Skaffa Component Registry Schema](./skaffa_component_registry_schema.md)
- [Skaffa Project Graph Schema + Patch Protocol](./skaffa_project_graph_schema.md)

---

## 1. Where Extensions Run (Process Boundaries)

Extensions run in the **Extension Host process** (Node.js). They are not browser code.

Implications:
- Extensions can use Node APIs (e.g. `fs`, `path`) where permitted by the Extension API surface.
- Extensions **cannot** directly manipulate:
  - the renderer DOM (Workbench UI),
  - the preview DOM (your app),
  - Electron primitives like `BrowserWindow` / `WebContents`.
- All cross-boundary effects flow through the **typed Extension Context APIs**.

If you’re unsure where a behavior belongs, consult:
- `docs/index.md:88` (process model)
- `docs/skaffa_ipc_boundaries_and_sequences.md:1` (canonical flows)

### 1.1 Extension Bundle Layout (Recommended)

Extensions are best organized as bundles so a single feature can ship:
- an **extension-host module** (registry/graph/launcher code), and
- optional **runtime packages** (UI components or helpers used by app code).

Recommended layout:

```text
extensions/
  layout/
    module/
      index.js           # extension-host entrypoint (referenced by skaffa.config.js)
    packages/
      layout-primitives/
        src/
        package.json
```

Notes:
- `module/` runs in the extension host process.
- `packages/` are regular workspace packages consumed by apps or preview runtimes.
- `module/index.js` is the runtime entrypoint. In v0 it is a bundled artifact
  produced by `pnpm build:modules` (from `module/index.ts` or `module/index.js`)
  and is safe to commit for workspace portability.

---

## 2. The v0 Extension Context (Current Shape)

In v0, extensions activate via:

```ts
export function activate(ctx: ExtensionContext): void | Promise<void>
```

Key capabilities currently exposed:
- `ctx.registry.contributeRegistry(registry)` for component metadata composition
- `ctx.graph.registerProducer(producer)` for project graph production

Naming note:
- Registries use **“contribute”** to emphasize merge/composition semantics.
- Graph producers use **“register”** to emphasize a single active producer instance.

---

## 3. Type Import Conventions (Extension SDK)

v0 extensions should import from the **Extension SDK entrypoint** for a stable API surface.
The source lives in `extension-sdk.ts`; `pnpm build:modules` bundles it to
`extension-sdk.js` at the repo root. If the `.js` file is missing, run
`pnpm build:modules` before developing extensions.

**Recommended (v0):**

```ts
import type {
  ExtensionContext,
  ComponentRegistry,
  GraphPatch,
  GraphSnapshot,
} from '../../extension-sdk.js';
```

The SDK entrypoint re-exports all extension-facing types:
- Extension context types (ExtensionContext, GraphProducer, PreviewLauncher, etc.)
- Shared protocol types (ComponentRegistry, GraphPatch, OverrideOp, etc.)
- Zod schemas for runtime validation (ComponentTypeIdSchema, etc.)

This avoids brittle deep imports into `src/` and provides a stable import surface for workspace-local extensions.

**Legacy (still supported):**

If you need to import from src/ directly (e.g., for types not yet exported by the SDK):

```ts
import type { ExtensionContext } from '../../../src/extension-host/extension-context.js';
import type { ComponentRegistry } from '../../../src/shared/index.js';
```

Planned (not v0): a published package such as `@skaffa/extension-api` so extensions do not need workspace-relative paths.

---

## 4. Branded Types (Zod) and Graph Construction Helpers

Skaffa's shared protocol uses Zod-branded identifiers for safety (e.g. `ComponentTypeId`, `RouteId`).

**RECOMMENDED**: Use the graph construction helpers provided by the Extension SDK to avoid `as any` casts:

```ts
import {
  createRouteNode,
  createComponentTypeNode,
  createRouteUsesComponentTypeEdge,
  createComponentTypeUsesComponentTypeEdge,
} from '../../extension-sdk.js';

// Create nodes without casts
const nodes = [
  createRouteNode({
    path: '/',
    filePath: 'src/app/page.tsx',
    line: 1,
  }),
  createComponentTypeNode({
    id: 'ui.button',
    displayName: 'Button',
    filePath: 'src/components/Button.tsx',
    line: 5,
  }),
];

// Create edges without casts
const edges = [
  createRouteUsesComponentTypeEdge({
    routePath: '/',
    componentTypeId: 'ui.button',
  }),
  createComponentTypeUsesComponentTypeEdge({
    from: 'layout.header',
    to: 'ui.button',
  }),
];
```

**Advanced**: If you need to construct branded IDs directly, use the schema parsing functions:

```ts
import { ComponentTypeIdSchema, createComponentTypeId } from '../../extension-sdk.js';

// Using helper (recommended)
const typeId = createComponentTypeId('demo.button');

// Using schema directly (if you need custom validation)
const typeId = ComponentTypeIdSchema.parse('demo.button');
```

**Important**: Use `as const` for discriminated unions to preserve literal types (e.g. `schemaVersion: 'v0' as const`).

---

## 5. Type ID Consistency (Registry ↔ Graph ↔ Runtime)

`ComponentTypeId` is the join key across boundaries. The same string must match:

1. Component registry entry key (`components['demo.button']`)
2. Project graph component type node id (`{ kind: 'componentType', id: 'demo.button' }`)
3. Preview runtime instance identity (e.g. harness-model instrumentation that associates instances to `componentTypeId`)

If these don’t match, Skaffa can still select an instance, but the Inspector won’t have type-level metadata.

---

## 6. Logging & Debugging

In v0, `console.log()` from extensions appears in the **Electron DevTools console** for the main window (not in your terminal).

Recommended workflow:
- Open DevTools: `Help → Toggle Developer Tools`
- Filter by a prefix (e.g. `[DemoModule]`, `[GraphProducer]`)
- Treat logs as process-scoped; main/renderer/extension host logs may interleave in the same console output depending on implementation.

---

## 7. Common Failure Modes (v0)

- **Module loads but "does nothing"**: check DevTools for activation errors and confirm the module path in `skaffa.config.js`.
- **Registry contributed but Inspector shows raw props**: confirm `ComponentTypeId` matches registry ↔ graph ↔ runtime identity.
- **TypeScript friction in producers**: use the graph construction helpers (`createRouteNode`, `createComponentTypeNode`, etc.) from the Extension SDK to avoid `as any` casts. See section 4 for examples.
