# IPC Boundaries + Key Sequence Diagrams (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors and adapter authors  
> **Goal:** Capture critical cross-process flows as concrete sequence diagrams aligned with the multi-process architecture.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Project Graph Schema + Patch Protocol](./scaffa_project_graph_schema.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)

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

## 4. Apply Override (Inspector Edit → Preview Update)

```mermaid
sequenceDiagram
  participant UI as Renderer (Inspector)
  participant PL as Preload (scaffa.*)
  participant Main as Main Process (Host)
  participant RT as Runtime Adapter (in Preview)

  UI->>PL: overrides.set({sessionId, instanceId, path, value})
  PL->>Main: IPC overrides.set(request)
  Main->>Main: persist override transaction
  Main-->>RT: host.applyOverrides({sessionId, ops:[{op:"set", ...}]})
  RT->>RT: apply override + re-render
  Main-->>PL: IPC overrides.changed(state)
  PL-->>UI: window.scaffa.onOverridesChanged(cb)
  UI->>UI: show "Overridden" state + Reset action
```

---

## 5. Graph Patch Propagation (Adapter → Consumers)

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

## 6. Notes / Alignment Constraints

- Renderer never talks directly to extension host or preview runtime; it uses preload APIs.
- Main is the broker/authority for sessions and cross-boundary routing.
- Sequence diagrams assume trusted v0 environment; permission/sandboxing layers can be added later without changing message intent.
