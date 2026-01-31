# Skaffa Runtime Adapter Integration Guide (v0)

> **Status:** Draft / v0 guide  
> **Audience:** App/framework engineers integrating preview runtimes with Skaffa  
> **Goal:** Provide a single, end-to-end “recipe” for enabling click-to-select and non-destructive overrides in a preview runtime, aligned with the runtime adapter contract.

Related:
- [Architecture Plan](./index.md)
- [Skaffa Preview Session Protocol](./skaffa_preview_session_protocol.md)
- [Skaffa Runtime Adapter Contract](./skaffa_runtime_adapter_contract.md)
- [Skaffa Override Model + Persistence](./skaffa_override_model.md)

---

## 1. Mental Model

In v0, the runtime adapter is responsible for three things inside the preview runtime:
- Instance identity (what instance is this?)
- Click-to-select (which instance did the user click?)
- Override application (apply/clear prop overrides without rewriting source)

For React preview runtimes in this repo, those responsibilities are implemented by `packages/react-runtime-adapter`.

Editor View interaction policy (v0):
- Skaffa uses the embedded runtime as an editor canvas: click-to-select is the default.
- Clicks are consumed for selection (app navigation/handlers should not fire in the editor session).

### 1.1 Production Compatibility (Recommended)

Skaffa integration should not be required for your app to build and run in production.

Recommended approach:
- Use the **Harness Model** for managed previews: Skaffa mounts the app via a launcher-injected harness entrypoint, so your app code has **no Skaffa editor/runtime adapter imports** (UI libraries are allowed).
- Keep all Skaffa runtime logic **dev-only** and scoped to preview sessions started by Skaffa (managed mode).
- Install `@skaffa/react-runtime-adapter` as a **devDependency** (the launcher needs it at dev-time even though your source code doesn't import it).

See: `docs/skaffa_harness_model.md`.

---

## 2. Harness Model Recipe (Recommended)

In the Harness Model, the "three parts" still exist, but they are injected by the launcher/runtime adapter rather than authored in the app code.

**Important:** Even though your app source code has no Skaffa editor/runtime adapter imports, the runtime adapter package must be available at dev-time because the vite-launcher generates code that imports it (harness entrypoint + component instrumentation). Add `@skaffa/react-runtime-adapter` to `devDependencies` (NOT `dependencies`) so it's excluded from production builds.

### 2.1 Mount via a virtual harness entry

- The preview launcher (e.g. Vite launcher) serves a virtual module entry (e.g. `"/@skaffa/harness.tsx"`).
- That entry imports the project’s preview root and styles from `skaffa.config.js` and mounts to the DOM.
- The harness installs the runtime adapter provider/event wiring (equivalent of “wrap the app root with `SkaffaProvider`”).

### 2.2 Instrument registry-listed components

- Only component types in the composed registry are intended to be selectable/editable in v0.
- The launcher applies a dev-time transform to instrument the modules that correspond to those registry entries (including optional third-party packages like MUI).
- Instrumentation is responsible for associating a stable `componentTypeId` with runtime instances in a way the adapter can hit-test.

### 2.2.1 Mapping registry hints to transforms (v0)

Use the optional `ComponentImplementationHint` data from the registry to build a minimal allowlist.

- `kind: "file"`: resolve the workspace-relative path and match the exact module id.
- `kind: "package"`: resolve the bare specifier and match that module id (and subpath export if used).
- `exportName`: default to `"default"`; if missing, skip instrumentation and log a warning that includes `typeId` and the hint target.

For third-party packages, ensure the transform runs on dependency sources:
- add the instrumented specifiers to `optimizeDeps.exclude` to avoid prebundling
- keep the list narrow (only packages referenced by hints)

### 2.2.2 `componentTypeId` join key (v0)

Instrumentation should wrap the target export with a boundary that provides the join key to the adapter:
- The wrapper (`SkaffaInstanceBoundary`) passes `componentTypeId` from the registry entry `typeId`.
- The adapter owns `instanceId` generation; wrappers should not generate ids directly.
- **The boundary applies overrides automatically**: `SkaffaInstanceBoundary` retrieves overrides from the adapter and applies them to props before passing them to the wrapped component. App code does NOT need to import or use `SkaffaInstance` or `useSkaffaInstance`.
- Selection events emitted by the adapter must include `{ instanceId, componentTypeId }`.

### 2.3 Apply overrides via adapter-owned boundaries

- Overrides must be applied non-destructively in the preview runtime.
- The adapter owns the override map and rerender mechanism; app source files are not rewritten at runtime.
- **Automatic override application**: `SkaffaInstanceBoundary` (injected by instrumentation) applies overrides to props transparently, so component code remains clean of Skaffa imports.

For the full decision record and constraints, see: `docs/skaffa_harness_model.md`.

---

## 3. Architecture: Pure Harness Model

This clarifies the boundaries between production bootstrap and Skaffa preview bootstrap. In the pure harness model, Skaffa never loads your production entrypoint; it replaces it.

See also: `docs/skaffa_harness_model.md` for the managed preview entrypoint and Vite plugin behavior.

### 3.1 Production build

`index.html` -> `src/main.tsx` (production bootstrap) -> `src/App.tsx` (router + UI) -> `src/pages/*.tsx` -> `src/components/*.tsx`

**No Skaffa editor/runtime adapter imports required**: Components are written as standard React components with no Skaffa editor/runtime adapter dependencies.

### 3.2 Skaffa preview

`index.html` (transformed by harness plugin) -> `/@skaffa/harness.tsx` (virtual module served by Vite plugin) -> `SkaffaProvider` (real adapter) -> `src/App.tsx` (router + UI) -> registry-listed components are automatically wrapped with `SkaffaInstanceBoundary` (injected by vite-launcher instrumentation plugin) -> overrides applied transparently

### 3.3 Key boundary

`main.tsx` is NEVER loaded by Skaffa:
- `main.tsx` is production-only
- Skaffa's harness replaces it in `index.html`
- `App.tsx` must be self-contained and create its own router instance
- Route definitions should live in `routes.tsx` (required by react-router-graph-producer in v0)

---

## 4. Common Pitfalls

- **`typeId` mismatch**: selection works, but Inspector lacks metadata (registry ↔ runtime mismatch).
- **Incorrect preview URL**: preview sessions require a full URL with protocol (see `docs/skaffa_preview_session_protocol.md:30`).
- **Attached mode mismatch**: attaching to an arbitrary dev server does not guarantee harness/instrumentation is installed; use managed mode for Harness Model behavior.
- **Third-party instrumentation not running**: selected `node_modules` packages may be prebundled; the launcher may need Vite `optimizeDeps` tuning to ensure transforms run on intended sources.

---

## Appendix: Project-Local Shim (Legacy / Escape Hatch)

If you cannot use managed mode (or need an incremental migration), a project-local shim can provide a dev-only provider mount. This is not the preferred v0 direction for Skaffa-managed previews.

Note: Instance identity still comes from launcher instrumentation; app components should not import `SkaffaInstance` or `useSkaffaInstance`.

Then, switch that module between:
- **No-op provider exports** for production (and/or normal dev).
- **Real provider exports** for Skaffa-enabled preview.

How you switch is toolchain-specific (Vite alias, conditional entrypoints, environment-flagged builds). The important invariant is:
- your production build must not require `@skaffa/*` packages to be installed.
  - Exception: the demo workspace uses `@skaffa/layout-primitives-react` as a runtime
    dependency for layout primitives. In-repo we install it from a local tarball in
    `demo/vendor/`, but if you extract the demo app, treat it like a normal UI package
    and install it from your registry.

### Example: Vite-based Implementation

For Vite projects, use mode-based aliases to switch between dev and production shims:

**1. Create dev shim** (`src/skaffa-runtime.dev.ts`):
```ts
export {
  SkaffaProvider,
} from '@skaffa/react-runtime-adapter';
```

**2. Create production shim** (`src/skaffa-runtime.prod.ts`):
```ts
import type { ReactNode } from 'react';

export function SkaffaProvider({ children }: { children: ReactNode; config?: unknown }) {
  return children;
}
```

**3. Configure Vite alias** (`vite.config.ts`):
```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@/skaffa-runtime': path.resolve(
        __dirname,
        `src/skaffa-runtime.${mode === 'production' ? 'prod' : 'dev'}.ts`
      ),
    },
  },
}));
```

**4. Configure TypeScript** (`tsconfig.json`):
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/skaffa-runtime": ["./src/skaffa-runtime.dev.ts"]
    }
  }
}
```

**5. Move adapter to devDependencies** (`package.json`):
```json
{
  "devDependencies": {
    "@skaffa/react-runtime-adapter": "workspace:*"
  }
}
```

**6. Import from shim in your preview entrypoint**:
```tsx
import { SkaffaProvider } from '@/skaffa-runtime';
```

With this setup:
- `pnpm dev` uses the real adapter (mode='development')
- `pnpm build` uses no-ops (mode='production')
- Production builds have zero runtime dependency on @skaffa/* packages
  - Exception: the demo workspace intentionally depends on
    `@skaffa/layout-primitives-react` at runtime.

---

## 5. Performance Notes (v0)

The React adapter recomputes “effective props” when overrides change. For small apps this is effectively instant.

If you see perf issues in larger apps:
- Prefer smaller prop objects and stable references where possible.
- Avoid passing large, deeply nested props into instrumented components unless you expect overrides.
- Consider limiting which components are wrapped as instances during early integration.
