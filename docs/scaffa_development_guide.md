# Scaffa Development Guide

> **Status:** Living document
> **Audience:** Scaffa core contributors
> **Goal:** Document development setup, common issues, and lessons learned during implementation.

Related:
- [Architecture Plan](./index.md)
- [IPC Boundaries & Sequences](./scaffa_ipc_boundaries_and_sequences.md)

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

### UI Components (shadcn/ui)

Use shadcn/ui (BaseUI variant) as the default source of renderer components.

```bash
cd src/renderer
pnpm dlx shadcn@latest add <component...>
```

After adding components, replace any shadcn palette utility classes (e.g. `bg-background`, `text-foreground`, `ring-ring`) with Scaffa theme tokens from `src/renderer/styles.css` (e.g. `bg-surface-*`, `text-fg*`, `border-default`, `ring-focus`).

### Running the Demo Workspace

The v0 demo workflow uses two independent processes: the demo app dev server (preview target) and Scaffa (the editor).

#### Option 1: Single Command (Recommended for Local Development)

```bash
# One-time setup: Install demo app dependencies
pnpm -C demo/app run install:local

# Start both Scaffa and demo app together
pnpm dev:demo
```

This uses `concurrently` to run both processes. Exit with Ctrl+C to stop both cleanly.

#### Option 2: Two Terminals (Explicit Control)

1) **Demo app dev server** (preview target)

```bash
cd demo/app
pnpm install
pnpm dev
```

This prints a URL like `http://localhost:5173`. Scaffa attaches to this URL for `app` preview sessions.

2) **Scaffa** (the editor)

```bash
pnpm dev
```

#### Notes

v0 intentionally does not auto-start framework dev servers; preview targets are treated as external HTTP runtimes. The `dev:demo` convenience script simply launches both processes in parallel.

### Hot Reload Behavior

- **Renderer**: Vite provides instant HMR
- **Main process**: Requires restart (kill and re-run `pnpm dev`)
- **Extension host**: Requires restart (kill and re-run `pnpm dev`)
- **Preload scripts**: Requires restart

---

## 2. Build System Architecture

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

If `scaffa.config.ts` validation fails or a module fails to load, start by checking the same DevTools console output for errors.

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

## 6. Next Steps (Post-v0)

Future improvements for the development experience:

- [ ] Add TypeScript build verification (`tsc --noEmit`)
- [ ] Set up test infrastructure (Vitest + @testing-library/react)
- [ ] Add pre-commit hooks for linting/formatting
- [ ] Create development extension/module for testing
- [ ] Document hot-reload behavior for each process
- [ ] Add CSP configuration for production builds
