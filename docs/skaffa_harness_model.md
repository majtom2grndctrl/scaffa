# Scaffa Harness Model (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors, launcher authors, adapter authors, and app engineers  
> **Goal:** Define how Scaffa mounts a project’s app/component previews **without requiring any Scaffa imports in the project’s production code**.

## 0. Summary (Decisions)

- Scaffa uses a **managed preview launcher** (first: `vite-launcher`) as the default way to run app previews.
- Scaffa injects a **virtual harness entrypoint** at dev time; the project’s `src/main.tsx` remains a standard bootstrapper with **no Scaffa editor/runtime adapter references** (UI libraries under `@scaffa/*` are allowed).
- Only **registry-listed** component types are selectable/editable in Editor View.
- Selection/editability in the preview runtime is enabled via **dev-time instrumentation** driven by the composed component registry (including optional third-party registries like MUI).
- The launcher runs against the **project’s installed Vite** (stable Vite), loading the project config and merging Scaffa’s injected config/plugins.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Project Configuration (`scaffa.config.js`)](./scaffa_project_configuration_scaffa_config.md)
- [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)

---

## 1. Goal

Decouple Scaffa runtime logic from user production code.

In Scaffa-managed previews, the user’s app does **not** import Scaffa packages or wrappers. Instead, Scaffa mounts the app (or a component harness) via a launcher-provided harness entrypoint.

---

## 2. Where This Runs (Process Boundaries)

- **Main process** owns preview session lifetimes and `WebContents` (BrowserView in v0).
- **Extension host** owns contributing module registries and providing launcher-related contributions/config.
- **Main process** owns the effective, composed registry snapshot (module registries + project overrides) and brokers it across boundaries.
- **Launcher runtime (Node process)** owns starting and supervising the project dev server (Vite) and surfacing logs/readiness.
- **Preview runtime** is the web app executing in the preview `WebContents`.
- **Runtime adapter** runs inside the preview runtime and emits `runtime.ready`, selection events, and applies override ops.

---

## 3. Managed vs Attached (Policy)

Scaffa supports both `PreviewSessionTarget` shapes:
- **Managed** (`launcherId`): Scaffa starts the dev server via a launcher module. This is the recommended v0 path for Harness Model.
- **Attached** (`url`): Scaffa attaches to an existing dev server. This remains an escape hatch, but Harness Model guarantees (virtual harness + instrumentation) are only provided when the server is started with Scaffa’s injected plugins.

---

## 4. Virtual Harness Entry (Vite)

In a Vite-managed preview, the launcher injects a virtual entrypoint (served from memory) that:
- imports the user’s configured preview root (e.g. `preview.entry: "./src/App.tsx"`)
- imports the user’s global styles (e.g. `preview.styles: ["./src/index.css"]`)
- installs the runtime adapter (provider/event wiring)
- mounts to `#root`

Mechanically, the launcher implements this as a Vite plugin that:
- transforms `index.html` to load `"/@scaffa/harness.tsx"` (or an equivalent injected module)
- serves `"/@scaffa/harness.tsx"` as a virtual module

### 4.1 Preview Entry Structure (App vs main)

Scaffa keeps production bootstrapping separate from the preview entry so it can control navigation and instrumentation without polluting production code.

Example file structure (demo app):
- Production entry: `demo/app/src/main.tsx` (no Scaffa editor/runtime adapter deps; production-only providers like analytics/error boundaries/auth)
- Preview entry: `demo/app/src/App.tsx` (imports route definitions and creates router instance)
- Route definitions: `demo/app/src/routes.tsx` (exports route array; parsed by react-router-graph-producer)
- Harness: `/@scaffa/harness.tsx` (virtual module served by Vite plugin) that wraps `App.tsx` with the Scaffa provider/adapter

Why `App.tsx` owns the router (instance):
- `main.tsx` stays production-only and stable across environments
- `App.tsx` remains the UI + routing boundary Scaffa can drive during preview sessions
- Route *definitions* live in `routes.tsx` so graph producers can statically parse them
- `App.tsx` imports and instantiates the router, keeping it navigable in preview
- The harness is where Scaffa-specific provider wiring lives, not production code

**v0 constraint:** The `react-router-graph-producer` expects route definitions at `app/src/routes.tsx`. This path is hardcoded in v0; future versions may allow configuration via `scaffa.config.js`.

**Important:** The routes file must use the `.tsx` extension (not `.ts`) because it contains JSX syntax (`element: <Component />`). Using `.ts` will cause esbuild transform errors since JSX is only processed in `.tsx` files.

---

## 5. Registry-Driven Instrumentation (Selection + Overrides)

### 5.1 Why “registry-driven”

Scaffa is instance-first, but in v0 it is also explicit about editability:
- Only components explicitly declared in the composed registry are intended to be selectable/editable in Editor View.

### 5.2 What the instrumentation does

For modules that match registry entries (including optional third-party packages):
- inject stable instance identity and `componentTypeId` join keys into the preview runtime
- ensure overrides can be applied non-destructively (no source rewriting in the preview runtime)

### 5.3 Safety rule (Hooks)

Instrumentation SHOULD avoid injecting React hooks into arbitrary user component bodies.

Preferred strategies:
- wrap exported components (export-level transform), or
- inject a stable boundary component that owns hook usage

### 5.4 Ownership and Data Flow (v0)

- **Main process** composes the effective registry and passes it to the launcher when starting a managed preview session.
- **Launcher runtime** derives instrumentation matchers from `ComponentImplementationHint` and wires a Vite plugin that performs the transforms.
- **Runtime adapter** consumes the resulting instance metadata; it does not decide what to instrument.

### 5.5 Matcher Construction (v0)

Match only what the registry explicitly declares.

- For `kind: "file"` hints, resolve the workspace-relative path to an absolute path and match that exact module id.
- For `kind: "package"` hints, resolve the bare specifier to a module id and match that exact entry (and its subpath export if used).
- No auto-discovery or repo-wide scanning in v0; the registry is the allowlist.

If package instrumentation is needed, the launcher should adjust Vite settings so transforms run on those dependencies:
- prefer `optimizeDeps.exclude` for the instrumented specifiers, so they are not prebundled
- avoid global excludes; only touch packages in the registry

### 5.6 Runtime Join Key (v0)

Instrumentation must attach the registry `typeId` as the runtime `componentTypeId`:
- The transform should wrap the target export in a boundary component (`ScaffaInstanceBoundary`) and pass `componentTypeId`.
- Instance identity is owned by the adapter; the wrapper should not invent ids.
- **Override application is automatic**: `ScaffaInstanceBoundary` applies overrides to props before passing them to the wrapped component, so app code does NOT need to import or use `ScaffaInstance` or `useScaffaInstance`.
- Selection events emitted by the adapter must include `{ instanceId, componentTypeId }`.

### 5.7 Supported Component Patterns (v0)

The instrumentation transform should support common React component export patterns to ensure broad compatibility with existing codebases:

- **Default exports**: `export default function Component`, `export default class Component`
- **Named function exports**: `export function Component`
- **Named constant exports**: `export const Component = ...`
- **Named re-exports**: `export { Component }` (supports aliasing)

This ensures that most component libraries (including Shadcn UI and functional primitives) can be wrapped without manual changes to the source code.

---

## 6. Using the Project’s Vite (Compatibility)

The Vite launcher MUST run using the project’s Vite installation:
- load the project’s `vite.config.*` via Vite’s config loading APIs
- merge Scaffa’s injected configuration (plugins, optimizeDeps tweaks) using Vite’s merge utilities

This avoids version skew between Scaffa and the project.

---

## 7. Vite Plugin Conflicts (React Fast Refresh)

**Problem: React Fast Refresh double-injection**
- `vite:react-babel` injects the HMR preamble
- When the harness imports `App.tsx`, the preamble appears twice
- Results in "symbol already declared" errors

**Solution (v0)**
- Filter out React plugins and use `esbuild` for JSX
- Trade-off: no Fast Refresh in preview (acceptable for Inspector-driven editing)
- TODO: restore Fast Refresh for developer ergonomics

**Known limitation**
- Code changes require a manual refresh in the preview

---

## 8. Known Constraints (v0)

- Instrumenting select third-party libraries may require Vite `optimizeDeps` tuning to ensure the transform runs on the intended sources.
- “Selectable” is defined as “instrumented + resolvable to a stable `componentTypeId`”. Clicks that do not resolve to an instrumented instance result in `selected: null` (or selection of the nearest instrumented ancestor, if supported by the adapter).
