# Skaffa Extension API – v0 Sketch

> **Status:** Draft / v0 shape
> **Audience:** Extension and module authors (first‑party and internal)
> **Goal:** Define the minimal, stable API surface between Skaffa core and extension modules.

This document intentionally omits implementation details. It defines *contracts*, not mechanisms.

Related:
- [Architecture Plan](./index.md)
- [Skaffa Extension Authoring Guide](./skaffa_extension_authoring_guide.md)
- [Skaffa Project Graph Schema + Patch Protocol](./skaffa_project_graph_schema.md)
- [Skaffa Component Registry Schema](./skaffa_component_registry_schema.md)
- [Skaffa Workspace Edit Protocol](./skaffa_workspace_edit_protocol.md)

---

## 1. Core Principles

- All extension code runs in the **Extension Host** process.
- Extensions must not import Skaffa *implementation internals*; they interact through the Extension API surface and shared protocol types.
- Extensions interact with Skaffa only through the **Extension API**.
- The API is **capability‑based**, **typed**, and **versioned**.
- v0 assumes extensions are *trusted*, but shaped so sandboxing/permissions can be added later.
- All workspace IO is mediated by main-owned capabilities (implementation may use a sidecar process; extensions never access the filesystem directly).

---

## 2. Extension Lifecycle

### 2.1 Entry Point

Each extension exports a single activation function.

```ts
export function activate(ctx: ExtensionContext): void | Promise<void>
```

Optional:
```ts
export function deactivate(): void | Promise<void>
```

---

## 3. ExtensionContext

`ExtensionContext` is the sole entry point for all power.

```ts
interface ExtensionContext {
  readonly apiVersion: string

  workspace: WorkspaceAPI
  // planned: file-heavy and compute-heavy queries (sidecar-backed)
  analysis?: WorkspaceAnalysisAPI
  registry: RegistryAPI
  graph: ProjectGraphAPI
  preview: PreviewAPI
  ui: UIAPI
  commands: CommandAPI
  ai: AIAPI

  subscriptions: Disposable[]
}
```

Extensions must clean up resources by pushing disposables into `subscriptions`.

---

## 4. Workspace API

Read‑only by default; write access is explicit.

```ts
interface WorkspaceAPI {
  getRoot(): string
  readFile(path: string): Promise<string>
  applyEdits(edits: FileEdit[]): Promise<EditResult>
  watch(glob: string, cb: (event: FileEvent) => void): Disposable
}
```

All mutations are transactional and diffable.

See also: [Skaffa Workspace Edit Protocol](./skaffa_workspace_edit_protocol.md)

Implementation notes:
- Extensions MUST use `WorkspaceAPI` for workspace reads/writes; they must not import `fs` or access the workspace directly.
- Main owns the implementation of `WorkspaceAPI` and MAY delegate high-volume reads/search/analysis to a workspace sidecar (planned). See: [Skaffa Sidecar Process](./skaffa_sidecar_process.md)

### 4.1 Workspace Analysis API (Planned)

For operations that are likely to touch many files (search, indexing, parsing), Skaffa may expose an additional analysis capability that is sidecar-backed and mediated by main.

This is intentionally deferred until we have concrete needs and can keep the surface small.

---

## 5. Registry API

Extensions may contribute component registries that power the Inspector.

```ts
interface RegistryAPI {
  contributeRegistry(registry: ComponentRegistry): Disposable
}
```

Naming note:
- Registries use **`contribute*`** to emphasize composition/override semantics.
- Graph producers use **`register*`** to emphasize explicit producer registration.

---

## 6. Project Graph API

The Project Graph is the canonical model of the workspace.

```ts
interface ProjectGraphAPI {
  query<T>(query: GraphQuery): Promise<T>
  onPatch(cb: (patch: GraphPatch) => void): Disposable
}
```

Extensions **consume** the graph; only adapters/providers **produce** patches.

---

## 7. Preview API

Preview is session‑based.

```ts
interface PreviewAPI {
  /**
   * Registers a managed preview launcher (e.g. "vite").
   * Launchers are referenced by `PreviewSessionTarget.launcherId`.
   */
  registerLauncher(launcher: PreviewLauncherContribution): Disposable
  startSession(options: PreviewSessionOptions): Promise<PreviewSession>
  updateOverrides(sessionId: string, overrides: PropOverrides): void
  onSelection(cb: (selection: PreviewSelection) => void): Disposable
}

type PreviewLauncherContribution = {
  id: string
  displayName: string

  /**
   * Starts (and later stops) an external dev server used as a preview runtime.
   * The launcher runs outside the renderer and never manipulates WebContents directly.
   */
  startApp(options: {
    workspaceRoot: string
    launcherOptions?: Record<string, unknown>
  }): Promise<{
    url: string
    stop(): Promise<void>
  }>
}
```

Extensions never directly manipulate WebContents.

---

## 8. UI Contribution API

Extensions may contribute UI in constrained ways.

```ts
interface UIAPI {
  registerPanel(panel: PanelContribution): Disposable
  registerInspectorSection(section: InspectorSection): Disposable
}
```

All UI is declarative. Extensions do not imperatively mutate renderer state.
Design note (v0): the inspector UI API must remain **generic** and not be tailored to a single use case.
Avoid encoding layout-specific affordances or assumptions into the core API; prefer extension-provided
components, schema-driven controls, and composable sections that work for many domains.

---

## 9. Command API

Commands are the backbone of user interaction.

```ts
interface CommandAPI {
  registerCommand(command: CommandContribution): Disposable
}
```

Commands may be bound to menus, keybindings, or invoked by AI.

---

## 10. AI API (Phase 1)

AI is assistive and constrained.

```ts
interface AIAPI {
  registerPrompt(prompt: PromptTemplate): Disposable
  runPrompt(id: string, context: PromptContext): Promise<PromptResult>
}
```

AI cannot mutate the workspace directly; it must return edits or commands.

---

## 11. Versioning & Compatibility

- API is versioned (e.g. `v0`)
- Extensions must declare compatible API versions
- Deprecated APIs must remain functional for a defined window

---

## 12. Non‑Goals (v0)

- Direct filesystem access
- Direct Electron access
- Arbitrary network access
- Renderer DOM manipulation

These are intentionally excluded to preserve future sandboxing.
