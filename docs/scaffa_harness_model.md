# Scaffa Harness Model (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors, launcher authors, adapter authors, and app engineers  
> **Goal:** Define how Scaffa mounts a project’s app/component previews **without requiring any Scaffa imports in the project’s production code**.

## 0. Summary (Decisions)

- Scaffa uses a **managed preview launcher** (first: `vite-launcher`) as the default way to run app previews.
- Scaffa injects a **virtual harness entrypoint** at dev time; the project’s `src/main.tsx` remains a standard bootstrapper with **zero Scaffa references**.
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

---

## 6. Using the Project’s Vite (Compatibility)

The Vite launcher MUST run using the project’s Vite installation:
- load the project’s `vite.config.*` via Vite’s config loading APIs
- merge Scaffa’s injected configuration (plugins, optimizeDeps tweaks) using Vite’s merge utilities

This avoids version skew between Scaffa and the project.

---

## 7. Known Constraints (v0)

- Instrumenting select third-party libraries may require Vite `optimizeDeps` tuning to ensure the transform runs on the intended sources.
- “Selectable” is defined as “instrumented + resolvable to a stable `componentTypeId`”. Clicks that do not resolve to an instrumented instance result in `selected: null` (or selection of the nearest instrumented ancestor, if supported by the adapter).
