# Scaffa – Architecture Plan (Living Document)

> **Status:** Draft / Living document  
> **Intent:** This document captures the agreed architectural shape of Scaffa as of now. It is designed to be edited, amended, and versioned as Scaffa evolves.

---

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

### 3.1 Main Process (Host)

Responsibilities:
- App lifecycle
- Workspace management
- Window + view orchestration
- Launching and supervising the extension host
- Owning privileged OS capabilities

### 3.2 Renderer Process (Workbench UI)

Responsibilities:
- Docked editor UI
- Panels (Web View, Routes, Component Tree, Inspector)
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

---

## 4. Core Concepts

### 4.1 Project Graph

Scaffa maintains a **framework-agnostic Project Graph** as canonical truth.

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

This abstraction is required from day one.

### 4.3 Inspector

Inspector behavior:
- Operates on **instances**, not types
- Renders controls based on registry metadata
- Supports:
  - editable props
  - inspect-only props
  - opaque props with source links

All edits are **non-destructive overrides** applied to preview sessions.

---

## 5. Registry & Module System

### 5.1 Component Registries

Modules may contribute registries describing component libraries.

Example:
- Shadcn module maps Shadcn components to:
  - stable type IDs
  - editable prop manifests
  - control metadata

### 5.2 Project Manifest

Each Scaffa project defines a manifest (e.g. `scaffa.config.ts`) that:
- enables modules
- customizes or overrides registry entries
- defines providers/decorators

### 5.3 Runtime Adapters

Framework-specific runtime adapters handle:
- instance identification
- click-to-select
- applying prop overrides

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

## 8. Deferred (Explicitly Out of Scope for v0)

- Public extension marketplace
- Untrusted module sandboxing UI
- Type-level component authoring UI
- Full runtime tree introspection

These are architectural considerations, not v0 deliverables.

---

## 9. Guiding Principle

**Scaffa edits what it can prove is safe to edit, displays what it cannot, and always provides an escape hatch to code.**
