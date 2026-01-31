# Scaffa Development Guide

> **Status:** Living document
> **Audience:** Scaffa core contributors
> **Goal:** Document development setup, common issues, and lessons learned during implementation.

Related:
- [Architecture Plan](./index.md)
- [IPC Boundaries & Sequences](./scaffa_ipc_boundaries_and_sequences.md)
- [Scaffa Engineering Conventions](./scaffa_engineering_conventions.md)

---

## 1. Development Setup

### Running the App

```bash
# Start dev server (Vite + Electron)
pnpm dev

# Build production bundles
pnpm build

# Build only Electron main/preload/extension-host
pnpm build:electron

# Build only renderer (Vite)
pnpm build:renderer
```

### Skipping Auto-Restore

By default, Scaffa restores the last opened project on startup. For development or testing the launcher view, you can skip this behavior:

```bash
# Skip restoring the last project (show launcher)
pnpm dev -- --no-restore
```

### UI Components (shadcn/ui)

Use shadcn/ui (BaseUI variant) as the default source of renderer components.

```bash
cd src/renderer
pnpm dlx shadcn@latest add <component...>
```

After adding components, replace any shadcn palette utility classes (e.g. `bg-background`, `text-foreground`, `ring-ring`) with Scaffa theme tokens from `src/renderer/styles.css` (e.g. `bg-surface-*`, `text-fg*`, `border-default`, `ring-focus`).

For UI consistency, follow:
- `docs/design/visual-language.md`
- `docs/design/colors.md`

### Running the Demo Workspace

**Architectural note:** `demo/` is treated as a real workspace that could live outside the Scaffa repo. `demo/app` uses `--ignore-workspace` and its own `pnpm-lock.yaml` to simulate standalone project behavior. Its dependencies (including Scaffa extension modules and `@scaffa/config`) are installed from local tarballs in `demo/vendor/` to keep the workspace portable.

Before running the demo (or after extension changes), pack and install the local dependencies:

```bash
pnpm demo:refresh-extensions
```

This packs local extension modules plus `@scaffa/config` and `@scaffa/layout-primitives-react` into `demo/vendor/`, then installs both `demo/` and `demo/app/`.

The v0 demo workflow uses two independent processes: the demo app dev server (preview target) and Scaffa (the editor).

#### Option 1: Single Command (Recommended for Local Development)

```bash
# Pack + install demo workspace dependencies (once per change)
pnpm demo:refresh-extensions

# Start both Scaffa and demo app together
pnpm dev:demo
```

This uses `concurrently` to run both processes. Exit with Ctrl+C to stop both cleanly.

#### Option 2: Two Terminals (Explicit Control)

1) **Demo app dev server** (preview target)

```bash
pnpm demo:refresh-extensions
cd demo/app
pnpm dev
```

This prints a URL like `http://localhost:5173`. Scaffa attaches to this URL for `app` preview sessions.
If a Vite preview launcher is enabled, Scaffa can also start/manage the dev server in managed mode; attached-by-URL remains an escape hatch.

2) **Scaffa** (the editor)

```bash
pnpm dev
```

#### Notes

Scaffa **core** does not auto-start framework dev servers. Instead, dev-server startup is owned by toolchain-specific **preview launcher extensions**.

- If a project is a Vite project and enables a Vite launcher extension, starting an `app` preview session should start the Vite dev server (and surface its URL in session logs).
- The `dev:demo` convenience script simply launches both processes in parallel for faster iteration.

### Config Package (@scaffa/config)

`scaffa.config.js` is validated by shared Zod schemas in `src/shared/config.js`.
We generate a no-maintenance type shim with:

```bash
pnpm build:shared-types
```

The `packages/config` package copies `src/shared/config.js` and the generated
`src/shared/config.d.ts` into `packages/config/dist/` so the demo workspace can
import `defineScaffaConfig` via `@scaffa/config` without repo-relative paths.

### Hot Reload Behavior

- **Renderer**: Vite provides instant HMR
- **Main process**: Requires restart (kill and re-run `pnpm dev`)
- **Extension host**: Requires restart (kill and re-run `pnpm dev`)
- **Preload scripts**: Requires restart

---

## 2. Build System Architecture

### Extension Module Build Process

Scaffa bundles workspace-local extension modules in place:

- Entry discovery: `extensions/*/module/index.{ts,js}`
- SDK build: `extension-sdk.ts` is bundled to `extension-sdk.js`
- Bundling: `scripts/build-workspace-modules.mjs` runs via:

```bash
pnpm build:modules
```

Notes:
- `build:modules` also runs `pnpm build:shared-types` (for `src/shared/config.d.ts`).
- `.ts` entrypoints output to `.js` in the same folder.
- `.js` entrypoints are treated as build artifacts; running the build will overwrite them.

### Output Structure

The build produces the following structure:

```
dist/
├── main/
│   └── main.js              # Electron main process (ESM)
├── preload/
│   └── preload.js           # Main window preload (CommonJS)
├── runtime-transport-preload/
│   └── runtime-transport-preload.js  # Preview preload (CommonJS)
├── extension-host/
│   └── main.js              # Extension host process (ESM)
└── renderer/
    ├── index.html
    └── assets/
        ├── index-[hash].js  # Renderer bundle (ESM)
        └── index-[hash].css
```

### Sidecar Processes (Planned)

Scaffa may add a Rust “workspace sidecar” process for file-heavy and compute-heavy operations.

Planned dev conventions:
- Sidecar is spawned/supervised by main (never directly by renderer).
- Main resolves the sidecar binary via `SCAFFA_SIDECAR_PATH` (override) or a well-known local build output path.

Planned packaging conventions:
- The sidecar binary is bundled as an app resource and launched from `process.resourcesPath`.
- Packager selection/integration is a separate task (Forge vs electron-builder). Until that is decided, bundling remains planned.

See: `docs/scaffa_sidecar_process.md`

### Critical Build Constraints

#### 1. Preload Scripts Must Be CommonJS

**Issue:** Electron preload scripts cannot use ESM format due to sandboxing constraints.

**Solution:** Build preload scripts with `format: 'cjs'` in esbuild config.

```js
// scripts/build-electron.mjs
build({
  entryPoints: ['src/preload/preload.ts'],
  format: 'cjs',  // ← REQUIRED: Must be CommonJS, not ESM
  // ...
})
```

**Symptoms if wrong:**
- Console error: "SyntaxError: Cannot use import statement outside a module"
- Preload script fails to load
- `window.scaffa` API is undefined in renderer

#### 2. Extension Host Path Resolution

**Issue:** Extension host path must be relative to the built main process location (`dist/main/`).

**Correct path:**
```ts
// From dist/main/extension-host/extension-host-manager.js
const extHostPath = join(__dirname, '../extension-host/main.js');
// Resolves to: dist/extension-host/main.js ✓
```

**Incorrect path:**
```ts
const extHostPath = join(__dirname, '../../extension-host/main.js');
// Resolves to: extension-host/main.js (does not exist) ✗
```

**Symptoms if wrong:**
- Error: "Cannot find module '/path/to/extension-host/main.js'"
- Extension host crashes immediately on startup
- Max restart attempts reached

#### 3. Router Requires `<Outlet />` Not `{children}`

**Issue:** TanStack Router v1 uses `<Outlet />` to render child routes, not the `children` prop.

**Correct usage:**
```tsx
// Layout component (e.g., AppShell)
import { Outlet } from '@tanstack/react-router';

export const AppShell = () => {
  return (
    <div>
      <header>...</header>
      <main>
        <Outlet />  {/* ← Renders matched child route */}
      </main>
    </div>
  );
};
```

**Incorrect usage:**
```tsx
export const AppShell = ({ children }: PropsWithChildren) => {
  return <main>{children}</main>;  // ✗ Will not render routes
};
```

**Symptoms if wrong:**
- Layout renders but content area is blank
- No errors in console
- Routes defined but not displayed

---

## 3. Debugging Tips

### Electron DevTools

Open DevTools in the main window:
- macOS: `Cmd+Option+I`
- Windows/Linux: `Ctrl+Shift+I`
- Menu: View → Toggle Developer Tools

### Logging Conventions

All components use prefixed console logs:

```ts
console.log('[ExtHostManager] Starting extension host...');
console.log('[GraphStore] Initialized with snapshot:', snapshot);
console.log('[InspectorStore] Failed to load registry:', error);
```

Search logs by prefix to filter specific subsystems.

### Where Extension Logs Appear (v0)

In v0, `console.log()` from extension modules typically appears in the **Electron DevTools console** (main window), not in the terminal where you launched `pnpm dev`.

If `scaffa.config.js` validation fails or a module fails to load, start by checking the same DevTools console output for errors.

### Common Console Patterns

**Extension host ready:**
```
[ExtHostManager] Starting extension host...
[ExtHostManager] Spawning extension host process...
[ExtHost] Process started, waiting for init...
[ExtHost] Received init message
```

**Stores initialized:**
```
[GraphStore] Initialized with snapshot: [object Object]
[InspectorStore] Loaded registry: { components: {...} }
```

**IPC traffic:**
```
[IPC] graph:getSnapshot
[IPC] registry:get
[IPC] overrides:set
```

---

## 4. Testing Integration Issues

When adding new features, watch for:

1. **Path resolution** - Always test absolute paths resolve correctly after build
2. **Module format** - Verify ESM vs CommonJS based on context (main = ESM, preload = CJS)
3. **Router outlets** - New layout components must use `<Outlet />` not `{children}`
4. **IPC handlers** - Check both main and preload sides are registered
5. **Store initialization** - Verify stores initialize before components mount

---

## 5. Lessons Learned (v0 Implementation)

### Session 2026-01-11: First Run & Inspector Integration

**Issue:** App started but showed blank content below header.

**Root cause:** AppShell used `{children}` instead of `<Outlet />` for TanStack Router.

**Resolution:** Import `Outlet` from `@tanstack/react-router` and render it instead of children prop.

**Lesson:** TanStack Router v1 requires explicit `<Outlet />` usage in layout components. The `children` prop is not automatically populated with matched routes.

---

**Issue:** Extension host crashed with "Cannot find module" error.

**Root cause:** Path resolution calculated `../../extension-host/main.js` from `dist/main/`, which resolved outside the dist folder.

**Resolution:** Changed to `../extension-host/main.js` to correctly resolve within dist folder.

**Lesson:** Always verify `__dirname` context when using relative paths in built Electron apps. The directory structure in `dist/` differs from `src/`.

---

**Issue:** Preload script failed with "Cannot use import statement outside a module".

**Root cause:** Preload scripts were built with `format: 'esm'` but Electron requires CommonJS for sandboxed preloads.

**Resolution:** Changed esbuild config to `format: 'cjs'` for all preload scripts.

**Lesson:** Electron preload scripts must be CommonJS, even when the rest of the app uses ESM. This is a hard requirement due to Electron's sandbox model.

---

## 6. Testing

Scaffa v0 includes comprehensive test infrastructure:

- **Unit tests**: Vitest with support for both Node and jsdom environments
- **Component tests**: @testing-library/react for UI components
- **E2E tests**: Playwright for Electron smoke testing
- **Build tests**: Fixtures for module discovery and extension host activation

see also: [Testing section in README](../README.md#11-testing)

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage

# Run Playwright E2E tests
pnpm test:e2e
```

### Test Organization

Tests are co-located with source files (`*.test.ts`, `*.test.tsx`) and supplemented by shared helpers in `tests/`:

- `tests/setup/` - Global test configuration
- `tests/helpers/` - Reusable testing utilities
- `tests/fixtures/` - Test data and mock factories
- `tests/e2e/` - Playwright E2E tests

For detailed patterns and examples, see [Testing section in README](../README.md#11-testing).

---

## 7. Next Steps (Post-v0)

Future improvements for the development experience:

- [ ] Add TypeScript build verification (`tsc --noEmit`)
- [x] Set up test infrastructure (Vitest + @testing-library/react) ✓ 
- [ ] Add pre-commit hooks for linting/formatting
- [ ] Create development extension/module for testing
- [ ] Document hot-reload behavior for each process
- [ ] Add CSP configuration for production builds
