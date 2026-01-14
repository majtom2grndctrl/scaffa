# IPC Boundaries + Key Sequence Diagrams (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors and adapter authors  
> **Goal:** Capture critical cross-process flows as concrete sequence diagrams aligned with the multi-process architecture.

## Agent TL;DR

- Load when: debugging or changing **cross-process flows** (renderer↔preload↔main↔extension-host↔preview-runtime).
- Primary value: canonical process boundary definitions + mermaid diagrams for session start, selection, and override flows.
- Don’t load when: you only need the data model (`docs/scaffa_override_model.md`) or registry schema (`docs/scaffa_component_registry_schema.md`).
- Also load: `docs/scaffa_preview_session_protocol.md` for the precise contract terms used in the diagrams.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Project Graph Schema + Patch Protocol](./scaffa_project_graph_schema.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- [Scaffa MCP Server Contract](./scaffa_mcp_server_contract.md)

---

## 1. Process Boundaries (Canonical)

Scaffa is a multi-process Electron app:

- **Renderer (Workbench UI):** React UI, no Node/Electron APIs
- **Preload (Gateway):** typed capability surface exposed to the renderer
- **Main (Host):** owns windows, preview sessions, privileged capabilities
- **Extension Host:** runs modules (registries, adapters, graph producers)
- **Preview Runtime:** app/component code executing in a session `WebContents`
- **Runtime Adapter:** framework-specific code running inside the preview runtime

---

## 2. Start Preview Session (App)

```mermaid
sequenceDiagram
  participant UI as Renderer (Workbench)
  participant PL as Preload (scaffa.*)
  participant Main as Main Process (Host)
  participant View as Preview WebContents
  participant RT as Runtime Adapter (in Preview)
  participant Ext as Extension Host

  UI->>PL: preview.startSession({type:"app", url})
  PL->>Main: IPC preview.startSession(request)
  Main->>View: create WebContents + loadURL(url)
  View->>RT: load adapter bundle (framework-specific)
  RT-->>Main: runtime.ready({adapterId, capabilities})
  Main-->>RT: host.init({sessionId, initialOverrides})
  Main-->>UI: session.ready({sessionId, type:"app"})
  Main-->>Ext: session.ready({sessionId, target})
```

---

## 3. Selection Flow (Click-to-Select → Inspector)

```mermaid
sequenceDiagram
  participant RT as Runtime Adapter (in Preview)
  participant Main as Main Process (Host)
  participant PL as Preload (scaffa.*)
  participant UI as Renderer (Inspector)

  RT-->>Main: runtime.selectionChanged({sessionId, selected})
  Main-->>PL: IPC selection.changed({sessionId, selected})
  PL-->>UI: window.scaffa.onSelection(cb)
  UI->>UI: render Inspector for selected instance
```

---

## 4. Active Route Highlight (Router State → Routes Panel)

When a router integration is present, the preview runtime can emit “active route” state so the Workbench can highlight the currently displayed route without guessing.

```mermaid
sequenceDiagram
  participant RT as Preview Runtime (Router Integration)
  participant Main as Main Process (Host)
  participant PL as Preload (scaffa.*)
  participant UI as Renderer (Routes Panel)

  RT-->>Main: runtime.routerStateChanged({sessionId, pathname, matches})
  Main-->>PL: IPC router.stateChanged({sessionId, pathname, matches})
  PL-->>UI: window.scaffa.onRouterState(cb)
  UI->>UI: highlight active route id(s)
```

---

## 5. Apply Draft Override (Inspector Edit → Preview Update)

```mermaid
sequenceDiagram
  participant UI as Renderer (Inspector)
  participant PL as Preload (scaffa.*)
  participant Main as Main Process (Host)
  participant RT as Runtime Adapter (in Preview)

  UI->>PL: overrides.set({sessionId, instanceId, path, value})
  PL->>Main: IPC overrides.set(request)
  Main->>Main: record draft override transaction
  Main-->>RT: host.applyOverrides({sessionId, ops:[{op:"set", ...}]})
  RT->>RT: apply override + re-render
  Main-->>PL: IPC overrides.changed(state)
  PL-->>UI: window.scaffa.onOverridesChanged(cb)
  UI->>UI: show "Overridden" state + Reset action
```

---

## 6. Save Changes to Disk (Promote Draft Overrides → Code)

Saving converts draft overrides into workspace edits (working tree) and clears the saved draft overrides.

```mermaid
sequenceDiagram
  participant UI as Renderer (Workbench)
  participant PL as Preload (scaffa.*)
  participant Main as Main Process (Host)
  participant Ext as Extension Host (Framework Save Logic)
  participant RT as Runtime Adapter (in Preview)

  UI->>PL: workspace.save()
  PL->>Main: IPC workspace.save(request)
  Main->>Ext: promoteDraftOverridesToEdits({target, overrides})
  Ext-->>Main: workspace.applyEdits([{filePath, edits...}])
  Main->>Main: apply edits transactionally (working tree)
  Main-->>RT: host.clearOverrides({sessionId, cleared})
  Main-->>PL: IPC workspace.saveCompleted({applied, failed})
  PL-->>UI: window.scaffa.onSaveCompleted(cb)
```

Notes:
- The framework-specific “promote to code” logic lives in extensions/adapters; core applies edits.
- If promotion fails for some overrides, Scaffa keeps them as draft overrides and surfaces the failure (no silent dropping).

---

## 7. Graph Patch Propagation (Adapter → Consumers)

```mermaid
sequenceDiagram
  participant Ext as Extension Host (Adapter)
  participant Main as Main Process (Graph Broker)
  participant PL as Preload (scaffa.*)
  participant UI as Renderer (Workbench)

  Ext-->>Main: graph.patch({revision, ops})
  Main->>Main: apply patch to canonical graph
  Main-->>PL: IPC graph.patch({revision, ops})
  PL-->>UI: window.scaffa.onGraphPatch(cb)
  UI->>UI: update Project Graph Snapshot views
```

---

## 8. MCP Observability (External AI Tool ↔ Host State)

MCP clients are northbound consumers of the same canonical state as the renderer UI.

```mermaid
sequenceDiagram
  participant Tool as MCP Client (Claude Code)
  participant MCP as MCP Server (Main Process)
  participant Ext as Extension Host (Graph Producer)
  participant RT as Runtime Adapter (in Preview)

  Tool->>MCP: connect (Streamable HTTP + bearer token)
  Tool->>MCP: read selection.current
  MCP-->>Tool: { sessionId, selected: InstanceDescriptor | null, registryMatch }

  Tool->>MCP: read graph.snapshot
  MCP-->>Tool: { revision, nodes, edges }

  Tool->>MCP: subscribe graph.patches (from revision)
  Ext-->>MCP: graph.patch({revision, ops})
  MCP-->>Tool: graph.patch({revision, ops})

  RT-->>MCP: runtime.selectionChanged({sessionId, selected})
  MCP-->>Tool: preview.selectionChanged({sessionId, selected})
```

---

## 9. Notes / Alignment Constraints

- Renderer never talks directly to extension host or preview runtime; it uses preload APIs.
- Main is the broker/authority for sessions and cross-boundary routing.
- Sequence diagrams assume trusted v0 environment; permission/sandboxing layers can be added later without changing message intent.
