# Scaffa Runtime Adapter Integration Guide (v0)

> **Status:** Draft / v0 guide  
> **Audience:** App/framework engineers integrating preview runtimes with Scaffa  
> **Goal:** Provide a single, end-to-end “recipe” for enabling click-to-select and non-destructive overrides in a preview runtime, aligned with the runtime adapter contract.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)

---

## 1. Mental Model

In v0, the runtime adapter is responsible for three things inside the preview runtime:
- Instance identity (what instance is this?)
- Click-to-select (which instance did the user click?)
- Override application (apply/clear prop overrides without rewriting source)

For React preview runtimes in this repo, those responsibilities are implemented by `packages/react-runtime-adapter`.

Editor View interaction policy (v0):
- Scaffa uses the embedded runtime as an editor canvas: click-to-select is the default.
- Clicks are consumed for selection (app navigation/handlers should not fire in the editor session).

### 1.1 Production Compatibility (Recommended)

Scaffa integration should not be required for your app to build and run in production.

Recommended approach:
- Use the **Harness Model** for managed previews: Scaffa mounts the app via a launcher-injected harness entrypoint, so your app code has **zero Scaffa imports**.
- Keep all Scaffa runtime logic **dev-only** and scoped to preview sessions started by Scaffa (managed mode).
- Install `@scaffa/react-runtime-adapter` as a **devDependency** (the launcher needs it at dev-time even though your source code doesn't import it).

See: `docs/scaffa_harness_model.md`.

---

## 2. Harness Model Recipe (Recommended)

In the Harness Model, the "three parts" still exist, but they are injected by the launcher/runtime adapter rather than authored in the app code.

**Important:** Even though your app source code has zero Scaffa imports, the runtime adapter package must be available at dev-time because the vite-launcher generates code that imports it (harness entrypoint + component instrumentation). Add `@scaffa/react-runtime-adapter` to `devDependencies` (NOT `dependencies`) so it's excluded from production builds.

### 2.1 Mount via a virtual harness entry

- The preview launcher (e.g. Vite launcher) serves a virtual module entry (e.g. `"/@scaffa/harness.tsx"`).
- That entry imports the project’s preview root and styles from `scaffa.config.js` and mounts to the DOM.
- The harness installs the runtime adapter provider/event wiring (equivalent of “wrap the app root with `ScaffaProvider`”).

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
- The wrapper (`ScaffaInstanceBoundary`) passes `componentTypeId` from the registry entry `typeId`.
- The adapter owns `instanceId` generation; wrappers should not generate ids directly.
- **The boundary applies overrides automatically**: `ScaffaInstanceBoundary` retrieves overrides from the adapter and applies them to props before passing them to the wrapped component. App code does NOT need to import or use `ScaffaInstance` or `useScaffaInstance`.
- Selection events emitted by the adapter must include `{ instanceId, componentTypeId }`.

### 2.3 Apply overrides via adapter-owned boundaries

- Overrides must be applied non-destructively in the preview runtime.
- The adapter owns the override map and rerender mechanism; app source files are not rewritten at runtime.
- **Automatic override application**: `ScaffaInstanceBoundary` (injected by instrumentation) applies overrides to props transparently, so component code remains clean of Scaffa imports.

For the full decision record and constraints, see: `docs/scaffa_harness_model.md`.

---

## 3. Architecture: Pure Harness Model

This clarifies the boundaries between production bootstrap and Scaffa preview bootstrap. In the pure harness model, Scaffa never loads your production entrypoint; it replaces it.

See also: `docs/scaffa_harness_model.md` for the managed preview entrypoint and Vite plugin behavior.

### 3.1 Production build

`index.html` -> `src/main.tsx` (production bootstrap) -> `src/App.tsx` (router + UI) -> `src/pages/*.tsx` -> `src/components/*.tsx`

**No Scaffa imports required**: Components are written as standard React components with no Scaffa dependencies.

### 3.2 Scaffa preview

`index.html` (transformed by harness plugin) -> `.scaffa-harness.tsx` (generated) -> `ScaffaProvider` (real adapter) -> `src/App.tsx` (router + UI) -> registry-listed components are automatically wrapped with `ScaffaInstanceBoundary` (injected by vite-launcher instrumentation plugin) -> overrides applied transparently

### 3.3 Key boundary

`main.tsx` is NEVER loaded by Scaffa:
- `main.tsx` is production-only
- Scaffa's harness replaces it in `index.html`
- `App.tsx` must be self-contained and include its own router

---

## 4. Common Pitfalls

- **`typeId` mismatch**: selection works, but Inspector lacks metadata (registry ↔ runtime mismatch).
- **Incorrect preview URL**: preview sessions require a full URL with protocol (see `docs/scaffa_preview_session_protocol.md:30`).
- **Attached mode mismatch**: attaching to an arbitrary dev server does not guarantee harness/instrumentation is installed; use managed mode for Harness Model behavior.
- **Third-party instrumentation not running**: selected `node_modules` packages may be prebundled; the launcher may need Vite `optimizeDeps` tuning to ensure transforms run on intended sources.

---

## Appendix: Project-Local Shim (Legacy / Escape Hatch)

If you cannot use managed mode (or need an incremental migration), a project-local shim can provide a dev-only integration path. This is not the preferred v0 direction for Scaffa-managed previews.

Note: In the pure harness model, components still import from the shim. The difference is that Scaffa installs the real adapter in the harness, and `main.tsx` is never part of the preview boot chain.

Then, switch that module between:
- **No-op exports** for production (and/or normal dev).
- **Real adapter exports** for Scaffa-enabled dev.

How you switch is toolchain-specific (Vite alias, conditional entrypoints, environment-flagged builds). The important invariant is:
- your production build must not require `@scaffa/*` packages to be installed.

### Example: Vite-based Implementation

For Vite projects, use mode-based aliases to switch between dev and production shims:

**1. Create dev shim** (`src/scaffa-runtime.dev.ts`):
```ts
export {
  ScaffaProvider,
  ScaffaInstance,
  useScaffaInstance,
} from '@scaffa/react-runtime-adapter';
```

**2. Create production shim** (`src/scaffa-runtime.prod.ts`):
```ts
import type { ReactNode } from 'react';

export function ScaffaProvider({ children }: { children: ReactNode; config?: unknown }) {
  return children;
}

export function ScaffaInstance({ children }: { children: ReactNode; typeId?: string; displayName?: string }) {
  return children;
}

export function useScaffaInstance<T>(props: T): T {
  return props;
}
```

**3. Configure Vite alias** (`vite.config.ts`):
```ts
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig(({ mode }) => ({
  resolve: {
    alias: {
      '@/scaffa-runtime': path.resolve(
        __dirname,
        `src/scaffa-runtime.${mode === 'production' ? 'prod' : 'dev'}.ts`
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
      "@/scaffa-runtime": ["./src/scaffa-runtime.dev.ts"]
    }
  }
}
```

**5. Move adapter to devDependencies** (`package.json`):
```json
{
  "devDependencies": {
    "@scaffa/react-runtime-adapter": "workspace:*"
  }
}
```

**6. Import from shim everywhere**:
```tsx
import { ScaffaProvider, ScaffaInstance, useScaffaInstance } from '@/scaffa-runtime';
```

With this setup:
- `pnpm dev` uses the real adapter (mode='development')
- `pnpm build` uses no-ops (mode='production')
- Production builds have zero runtime dependency on @scaffa/* packages

---

## 5. Performance Notes (v0)

The React adapter recomputes “effective props” when overrides change. For small apps this is effectively instant.

If you see perf issues in larger apps:
- Prefer smaller prop objects and stable references where possible.
- Avoid passing large, deeply nested objects through `useScaffaInstance()` unless you expect to override them.
- Consider limiting which components are wrapped as instances during early integration.
