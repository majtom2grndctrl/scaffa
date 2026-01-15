# Scaffa – Architecture Plan (Living Document)

> **Status:** Draft / Living document  
> **Intent:** This document captures the agreed architectural shape of Scaffa as of now. It is designed to be edited, amended, and versioned as Scaffa evolves.

---

## Agent TL;DR

- Use this file as a **router**: pick 2–4 linked docs for the task, don’t load everything.
- Source of truth for: **process model**, **core concepts**, and where contracts live.
- Don’t use for: deep schema details (load the specific contract doc instead).

## Agent Router (Task → Minimal Docs)

- **UI visual language / theme tokens** → `docs/design/visual-language.md`, `docs/design/colors.md`
- **Add/normalize UI components (shadcn)** → `.claude/skills/add-shadcn-component/SKILL.md`, `docs/design/colors.md`
- **Engineering conventions / code style** → `docs/scaffa_engineering_conventions.md`, `docs/scaffa_development_guide.md`
- **Inspector behavior & editing semantics** → `docs/scaffa_inspector_ux_semantics.md`, `docs/scaffa_component_registry_schema.md`, `docs/scaffa_override_model.md`
- **Override model (data + persistence)** → `docs/scaffa_override_model.md`, `docs/scaffa_preview_session_protocol.md`
- **Save to disk (validation + promotion)** → `docs/scaffa_save_to_disk_protocol.md`, `docs/scaffa_override_model.md`, `docs/scaffa_inspector_ux_semantics.md`
- **Workspace file edits** → `docs/scaffa_workspace_edit_protocol.md`, `docs/scaffa_extension_api.md`
- **Preview sessions & selection flows** → `docs/scaffa_preview_session_protocol.md`, `docs/scaffa_ipc_boundaries_and_sequences.md`, `docs/scaffa_runtime_adapter_contract.md`
- **Runtime adapter implementation** → `docs/scaffa_runtime_adapter_contract.md`, `docs/scaffa_runtime_adapter_integration_guide.md`
- **Project configuration** → `docs/scaffa_project_configuration_scaffa_config.md`
- **Extension API / modules** → `docs/scaffa_extension_api.md`, `docs/scaffa_extension_authoring_guide.md`
- **Cross-process IPC debugging** → `docs/scaffa_ipc_boundaries_and_sequences.md`, `docs/scaffa_development_guide.md`
- **MCP server/tooling** → `docs/scaffa_mcp_server_contract.md`
- **Dev environment / pitfalls** → `docs/scaffa_development_guide.md` (optional: `docs/lessons_learned.md`)

**Architecture contract docs (v0):**
- v0 scope + first journey: [Scaffa v0 Scope + First User Journey](./scaffa_v0_scope_and_user_journey.md)
- Runtime adapters: [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- Component registries: [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)
- Inspector semantics: [Scaffa Inspector UX Rules & Semantics](./scaffa_inspector_ux_semantics.md)
- Preview sessions: [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- Override model + persistence: [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- Save-to-disk protocol: [Scaffa Save-to-Disk Protocol](./scaffa_save_to_disk_protocol.md)
- Workspace edit protocol: [Scaffa Workspace Edit Protocol](./scaffa_workspace_edit_protocol.md)
- Project graph + patch protocol: [Scaffa Project Graph Schema + Patch Protocol](./scaffa_project_graph_schema.md)
- IPC boundaries + sequence diagrams: [IPC Boundaries + Key Sequence Diagrams](./scaffa_ipc_boundaries_and_sequences.md)
- MCP server: [Scaffa MCP Server Contract](./scaffa_mcp_server_contract.md)
- (Deferred) Iteration Deck sketch: [Iteration Deck Integration Sketch](./scaffa_iteration_deck_integration.md)

**Design language (v0):**
- Visual language: [Scaffa Visual Language](./design/visual-language.md)
- Theme color semantics: [Scaffa Semantic Color Utilities](./design/colors.md)

**Implementation guides (v0):**
- Extension authoring: [Scaffa Extension Authoring Guide](./scaffa_extension_authoring_guide.md)
- Engineering conventions: [Scaffa Engineering Conventions](./scaffa_engineering_conventions.md)
- Runtime adapter integration: [Scaffa Runtime Adapter Integration Guide](./scaffa_runtime_adapter_integration_guide.md)
- Development setup + pitfalls: [Scaffa Development Guide](./scaffa_development_guide.md)

## 1. Product Definition

> **CLI note:** Use `pnpm` for all applicable commands (install, dev server, builds).

Scaffa is an **Integrated Design Environment (IDE) for web-based software**.

It enables designers to work directly with real, production web code through:
- Visual structure inspired by game engines (notably Godot)
- Instance-first UI editing
- Explicit, engineer-authored configuration and guardrails
- AI-assisted workflows that are constrained, inspectable, and reversible

Scaffa is **not** a code generator that replaces engineering. It is an editor that:
- abstracts incidental complexity
- preserves control over output code
- always provides an escape hatch to source

Scaffa’s UI cannot (and should not) cover every aspect of code. Like game engines, it can surface a large, composable subset of structure and configuration, but complex logic will continue to live in code files.

---

## 2. Architectural Pillars

### 2.1 Instance-First Editing

Phase 1 focuses on **editing component instances**, not component types.

- Designers interact with concrete UI instances rendered in preview
- Component *types* and authoring UIs may come later
- This mirrors Godot’s inspector model: edit what exists, not abstract definitions

### 2.2 Explicit Editability

Scaffa does not infer editability by magic.

- Engineers provide a **configuration layer** that declares:
  - which components are editable
  - which props are editable vs inspect-only
  - how those props should be edited

Editable vs non-editable is a first-class concept surfaced in the Inspector UI.

### 2.3 Modular + Extensible by Design

Scaffa core ships with **minimal user-facing features**.

Most functionality is delivered via **modules**:
- framework adapters
- component library registries (e.g. Shadcn)
- internal company design systems
- future tooling (e.g. Iteration Deck)

Modules are expected to be authored both by Scaffa and by companies.

### 2.4 Extension Host Architecture (Case 2)

Scaffa supports **imperative, powerful modules** from day one using an **extension host**.

Key properties:
- All module code runs in a dedicated extension host process
- Modules never import core internals
- All power flows through a typed, versioned API

This enables:
- rich modules now
- sandboxing + permissions later without mass rewrites

---

## 3. Process Model

Scaffa is a **multi-process Electron application**.

See also: [IPC Boundaries + Key Sequence Diagrams](./scaffa_ipc_boundaries_and_sequences.md)

### 3.1 Main Process (Host)

Responsibilities:
- App lifecycle
- Workspace management
- Window + view orchestration
- Launching and supervising the extension host
- Owning privileged OS capabilities

### 3.2 Renderer Process (Launcher + Workbench UI)

Responsibilities:
- Launcher view (open / recent / create workspace entry point)
- Workbench UI (docked editor + panels)
- Panels (Editor View canvas, Preview Sessions List, Routes, Component Tree, Inspector)
- Projection of project graph + instance state

Constraints:
- No direct Electron or Node access
- All external effects go through preload APIs

### 3.3 Preload Layer (Capability Gateway)

Responsibilities:
- Typed, minimal surface between renderer and host
- Enforces security and isolation
- Forwards requests to main / extension host as appropriate

### 3.4 Extension Host Process

Responsibilities:
- Executes all module code
- Registers contributions (registries, panels, prompts, adapters)
- Subscribes to project graph updates
- Requests services via formal APIs

Modules may be imperative, but are boxed.

### 3.5 Workspace Sidecar Process (Optional, Planned)

Scaffa may optionally run one or more **sidecar processes** for operations that are:
- file-heavy (large workspaces, lots of reads)
- compute-heavy (parsing / indexing / analysis)
- latency-sensitive (incremental updates)

In v0, the most likely first sidecar is a **Workspace Sidecar** (implemented in Rust) supervised by the main process.

Responsibilities:
- Maintain a workspace file index and caches (content hashes, parsed artifacts)
- Serve high-volume reads/searches/analysis to Scaffa services
- Perform incremental recomputation on file change events

Constraints:
- Sidecar is not an authority: it is a service owned by main.
- Sidecar does not write to workspace; all workspace writes remain owned by main via transactional edits.
- Sidecar is not directly reachable from renderer; access is mediated by main-owned capabilities.

See also: [Scaffa Sidecar Process](./scaffa_sidecar_process.md)

### 3.6 Source Code Organization

The source code is organized by process boundary:

```
src/
├── main/                    # Main process (Electron host)
│   ├── main.ts             # Entry point
│   ├── config/             # Config loading + validation
│   ├── extension-host/     # Extension host management
│   ├── graph/              # Project graph store
│   ├── overrides/          # Override store + persistence
│   ├── registry/           # Registry composition
│   ├── workspace/          # Workspace management
│   └── ipc/                # IPC handlers (validation + routing)
├── renderer/                # Renderer process (Workbench UI)
│   ├── main.tsx            # Entry point
│   ├── router.tsx          # TanStack Router config
│   ├── components/         # UI components (Inspector, Graph, etc.)
│   ├── state/              # Zustand stores
│   └── views/              # Top-level views (AppShell, Launcher, Workbench)
├── extension-host/          # Extension host process
│   ├── main.ts             # Entry point
│   ├── extension-context.ts # Extension API surface
│   └── module-loader.ts    # Module loading + activation
├── preload/                 # Preload scripts (capability gateway)
│   └── preload.ts          # Main window preload
└── shared/                  # Cross-boundary protocol types
    ├── index.ts            # Re-exports for convenience
    ├── ipc.ts              # IPC schemas
    ├── registry.ts         # Component registry types
    ├── project-graph.ts    # Graph types
    ├── override.ts         # Override types
    └── preview-session.ts  # Preview session types
```

See `docs/scaffa_development_guide.md` for build output structure and development workflows.

---

## 4. Core Concepts

### 4.1 Project Graph

Scaffa maintains a **framework-agnostic Project Graph** as canonical truth.

See also: [Scaffa Project Graph Schema + Patch Protocol](./scaffa_project_graph_schema.md)

Includes:
- Routes
- Component types
- Component instances (runtime)
- Usage relationships

Adapters are responsible for populating and updating this graph.

### 4.2 Preview Sessions

Preview is modeled as sessions:
- `app` – running application
- `component` – harnessed component instance
- (future) `variant` – Iteration Deck

See also: [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)

This abstraction is required from day one.

In v0, preview targets are treated as **independent runtimes** (typically an HTTP server you start separately). Scaffa attaches by URL; it does not “bundle” or auto-start framework dev servers.

### 4.3 Inspector

Inspector behavior:
- Operates on **instances**, not types
- Renders controls based on registry metadata
- Supports:
  - editable props
  - inspect-only props
  - opaque props with source links

See also:
- [Scaffa Inspector UX Rules & Semantics](./scaffa_inspector_ux_semantics.md)
- [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)

Edits begin as **draft overrides** applied to preview sessions for immediate feedback, and can be **saved to disk** as working-tree code edits.

---

## 5. Registry & Module System

### 5.1 Component Registries

Modules may contribute registries describing component libraries.

See also: [Scaffa Component Registry Schema](./scaffa_component_registry_schema.md)

Example:
- Shadcn module maps Shadcn components to:
  - stable type IDs
  - editable prop manifests
  - control metadata

### 5.2 Project Manifest

Each Scaffa project defines a manifest (e.g. `scaffa.config.js`) that:
- enables modules
- customizes or overrides registry entries
- defines providers/decorators

### 5.3 Runtime Adapters

Framework-specific runtime adapters handle:
- instance identification
- inspection + selection (v0: <kbd>Alt/Option</kbd>+Click)
- applying prop overrides

See also: [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)

Adapters are separate from registries.

---

## 6. AI Integration (Phase 1)

AI is **assistive, not authoritative**.

Phase 1 support:
- Reusable prompt library
- Prompt templates with structured context
- AI-assisted creation of component types not supported in UI

All AI code changes:
- produce diffs
- are transactional
- are reviewable and reversible

---

## 7. Renderer UI Stack (Canonical)

> This section is merged from the existing *Scaffa Frontend Stack (Renderer)* document.

### Core Framework
- React
- React DOM
- TypeScript

### Build & Tooling
- Vite
- @vitejs/plugin-react

### Styling & UI Primitives
- Tailwind CSS (Scaffa UI only)
- PostCSS
- Autoprefixer
- shadcn/ui (BaseUI variant)

The renderer UI should default to shadcn/ui components for new primitives and composable UI pieces. Use the shadcn CLI from `src/renderer` and remap palette utility classes to Scaffa theme tokens in `src/renderer/styles.css` so renderer styling stays consistent.

### State & Workbench Architecture
- Zustand

State domains:
- Project Snapshot state
- UI Session state
- Draft / transient state

### Routing & Layout
- @tanstack/react-router

### Performance-Critical Primitives
- @tanstack/virtual
- @tanstack/table

### Forms & Inspector Editing
- @tanstack/form

### Async Data & IPC Boundaries
- @tanstack/react-query

### Schema & Validation
- Zod

### Devtools & Diagnostics
- @tanstack/react-query-devtools
- @tanstack/router-devtools
- React DevTools

### Explicit Non-Goals
- No Radix UI
- No CSS-in-JS
- No global React Context as app state
- Renderer does not import Electron APIs

---

## 8. Code Style & Accessibility (Canonical)

- Prefer code that is clear and understandable over clever code.
- Prefer accessible markup with semantic HTML.
- Follow: [Scaffa Engineering Conventions](./scaffa_engineering_conventions.md)

---

## 9. Deferred (Explicitly Out of Scope for v0)

- Public extension marketplace
- Untrusted module sandboxing UI
- Type-level component authoring UI
- Full runtime tree introspection

See also: [Iteration Deck Integration Sketch](./scaffa_iteration_deck_integration.md)

These are architectural considerations, not v0 deliverables.

---

## 10. Guiding Principle

**Scaffa edits what it can prove is safe to edit, displays what it cannot, and always provides an escape hatch to code.**
