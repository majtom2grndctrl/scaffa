# Scaffa Engineering Conventions (v0)

> **Status:** Living document  
> **Audience:** Scaffa core contributors (humans + coding agents)  
> **Goal:** Keep changes cohesive, readable, and safe across Scaffa’s multi-process Electron architecture.

Related:
- [Architecture Plan](./index.md)
- [IPC Boundaries + Key Sequence Diagrams](./scaffa_ipc_boundaries_and_sequences.md)
- [Scaffa Development Guide](./scaffa_development_guide.md)

---

## Agent TL;DR

- Optimize for **readability over cleverness**; prefer small, explicit changes.
- Respect **process boundaries**: renderer → preload → main → (extension host / preview runtime).
- Put **shared types + Zod schemas** in `src/shared/` and validate at every boundary.
- Renderer never imports Electron/Node; main owns privileged capabilities and workspace writes.
- In renderer: TanStack Router uses `<Outlet />`; Zustand for app state; React Query for async/IPC.

---

## 1) Repo Structure (By Process Boundary)

**Rule: code lives where it runs.** Do not “reach across” boundaries with imports.

- `src/main/` — Electron **main** (host). Owns windows, `BrowserView`, privileged OS + workspace writes.
- `src/preload/` — **preload** capability gateway. Minimal, typed surface exposed as `window.scaffa.*`.
- `src/renderer/` — **renderer** (React workbench UI). No Electron/Node APIs.
- `src/extension-host/` — **extension host** process (modules, adapters, promoters).
- `src/shared/` — **cross-boundary contracts**: Zod schemas + types shared by main/preload/renderer/ext-host.

---

## 2) TypeScript Conventions (v0)

### 2.1 Readability-first

- Prefer **plain TypeScript** over clever type gymnastics.
- Prefer **descriptive names** and early returns over deeply nested logic.
- Keep functions small; extract helpers only when it reduces duplication.

### 2.2 Types at boundaries

- Treat boundary inputs as `unknown`, then **parse/validate with Zod**.
- Avoid `any`. If you must temporarily, isolate it and add a follow-up ticket.
- Prefer discriminated unions (`type`/`kind`) over “stringly typed” branching.

### 2.3 “Schema + type” co-location

When a shape crosses a boundary, define:
- `XxxSchema` (Zod)
- `type Xxx = z.infer<typeof XxxSchema>`

Keep them in `src/shared/` and re-export through `src/shared/index.ts` when appropriate.

---

## 3) IPC + Capability Conventions

### 3.1 IPC layering (required)

- **Main** defines handlers in `src/main/ipc/*` using `ipcMain.handle(...)`.
- **Main** broadcasts events using `validateEvent(...)` before `webContents.send(...)`.
- **Preload** exposes a minimal API in `src/preload/preload.ts` via `contextBridge`.
- **Renderer** only calls `window.scaffa.*` (never `ipcRenderer` directly).

### 3.2 IPC safety rules

- Validate all request/response payloads:
  - In main: wrap handlers with `validated(...)`.
  - For events: validate before broadcasting.
- IPC payloads must be **serializable** (plain objects, arrays, primitives).
- Do not leak privileged objects (e.g., `BrowserWindow`, `WebContents`, filesystem handles) across preload.

### 3.3 “Adding a new capability” checklist

1. Add Zod schemas + types in `src/shared/` (request/response and any events).
2. Implement main handler in `src/main/ipc/*` using `validated(...)`.
3. Expose a typed preload method in `src/preload/preload.ts`.
4. Consume from renderer via a small client/store/hook (avoid calling IPC directly from leaf components).

---

## 4) Electron Footguns (v0 Defaults)

### 4.1 Window security defaults (non-negotiable)

- `contextIsolation: true`
- `nodeIntegration: false`
- Do not use Electron `webviewTag` for Scaffa UI.
- Prefer host-owned policies over “trusting the guest”.

### 4.2 Preload module format

- Preloads must build as **CommonJS** (`format: 'cjs'`). This is a hard Electron constraint.

### 4.3 BrowserView embedding rules

- The preview `BrowserView` must be constrained to a **renderer-owned viewport rectangle**.
- Renderer computes viewport bounds; main applies them to the `BrowserView`.
- Never assume “full window” bounds; the Workbench has docked panels.
- Treat resize/layout changes as first-class (no flicker, no overlaying panels).

### 4.4 Navigation + new-window policy (preview runtimes)

- Never allow guest content to spawn new Electron windows.
- Use `setWindowOpenHandler` (or equivalent) to **deny** or **redirect to system browser**.
- Decide navigation policy explicitly:
  - allow in-app navigation by default, but never for the inspect gesture click
  - optionally restrict cross-origin navigation (future hardening)

---

## 5) Renderer Conventions (React Workbench)

### 5.1 TanStack Router (required patterns)

- Layout routes render children using `<Outlet />` (not `{children}`).
- Keep route/layout components thin; prefer composition via components + stores.

### 5.2 State management

- Zustand stores in `src/renderer/state/` own app state and subscriptions.
- Avoid global React Context as app state (allowed: narrow, purely-presentational contexts).
- Prefer one store per domain (sessions, inspector, graph, etc.).

### 5.3 IPC + async

- Use React Query for async requests and caching (especially “fetch then render” flows).
- Keep side effects (subscriptions, event wiring) in store initialization code, not leaf components.

### 5.4 UI + theming

- Prefer shadcn/ui primitives (BaseUI variant).
- Do not use raw gray palette classes in components; use semantic tokens from `src/renderer/styles.css`:
  - `bg-surface-*`, `text-fg*`, `border-*`, `ring-focus`, etc.
- Follow `docs/design/visual-language.md` and `docs/design/colors.md`.

---

## 6) Logging, Errors, and Debuggability

- Prefix logs with a subsystem tag: `[PreviewSession]`, `[IPC]`, `[InspectorStore]`, etc.
- Log actionable failures once at the boundary; avoid spamming logs in hot paths.
- Prefer structured errors for user-facing failures (code + message + details).
- Make “happy path” easy to follow in code; keep failure branches explicit.

