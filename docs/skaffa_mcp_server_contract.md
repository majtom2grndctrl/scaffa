# Skaffa MCP Server Contract (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Skaffa core contributors and AI tool authors  
> **Goal:** Define the Skaffa-hosted MCP server that exposes the same canonical workspace + preview context consumed by the Workbench UI (selection, graph, registry, overrides), aligned with Skaffa’s multi-process architecture.

Related:
- [Architecture Plan](./index.md)
- [IPC Boundaries + Key Sequence Diagrams](./skaffa_ipc_boundaries_and_sequences.md)
- [Skaffa Preview Session Protocol](./skaffa_preview_session_protocol.md)
- [Skaffa Runtime Adapter Contract](./skaffa_runtime_adapter_contract.md)
- [Skaffa Project Graph Schema + Patch Protocol](./skaffa_project_graph_schema.md)
- [Skaffa Component Registry Schema](./skaffa_component_registry_schema.md)
- [Skaffa Override Model + Persistence](./skaffa_override_model.md)

---

## 1. Purpose

Skaffa’s Workbench UI is only one “client” of Skaffa’s authoritative state. An MCP server lets **external AI coding tools** (e.g. CLI-based editors/agents) access that same state so they can:

- ground answers in the current workspace model (registry, project graph)
- ground actions in the current preview context (active sessions, current selection)
- stay aligned with Skaffa’s “code is the source of truth” philosophy (file-backed artifacts + deterministic state)

The MCP server is a **northbound integration surface**. It is not a runtime adapter and does not run inside the preview runtime.

---

## 2. Placement in the Stack (Process Model)

The MCP server MUST be implemented adjacent to Skaffa’s **authoritative stores and brokers** (typically the **Main process**), so it can expose the same composed state the renderer consumes via preload APIs.

Constraints:
- MCP clients NEVER talk directly to:
  - the preview runtime DOM,
  - runtime adapter internals,
  - the renderer process.
- Preview/runtime information exposed via MCP is mediated through Main (and originates from the runtime adapter only via the existing session transport).

This preserves the process boundaries in `docs/index.md` and `docs/skaffa_ipc_boundaries_and_sequences.md`.

---

## 3. Lifecycle and Availability

v0 intent:
- The MCP server runs **only while the Skaffa desktop app is running**.
- The MCP server is tied to a specific loaded workspace (it can return “no workspace loaded” when applicable).

Availability rules:
- Workspace-scoped resources (effective registry, project graph, persisted overrides) are available when a workspace is loaded.
- Preview-scoped resources (sessions, current selection, runtime adapter readiness) are available only when a preview session exists; otherwise return empty/null with clear status.

Out of scope for v0:
- “Headless Skaffa” (running without the desktop app UI) as a required mode.

---

## 4. Transport and Security Defaults

Transport:
- The MCP server SHOULD use **Streamable HTTP** transport.

Network exposure defaults:
- Bind only to loopback (`127.0.0.1` / `::1`) by default.
- Remote binding (LAN/WAN) MUST be an explicit opt-in.

Authentication:
- Require a bearer token for all requests (even on localhost).
- Tokens SHOULD be short-lived (rotated on app launch and/or workspace open).
- Skaffa UI SHOULD provide a copyable connection string (base URL + token).

Browser hardening:
- Do not enable permissive CORS.
- Treat the preview runtime as untrusted web content; it must not be able to call the MCP server accidentally.

---

## 5. Scope (Phased)

### 5.1 v0: Observability (first win)

Primary goal: make external AI tools “aware” of Skaffa state without letting them mutate the workspace.

v0 SHOULD expose read-only context for:
- Effective component registry (composed modules + project overrides)
- Project graph snapshot (and optionally revision + patch stream)
- Override store state (and the persisted `/.skaffa/overrides.v0.json` representation)
- Preview sessions (active sessions, readiness, targets)
- Current selection (`InstanceDescriptor`) and its resolved context (matching registry entry / graph nodes when available)

v0 SHOULD NOT provide mutation tools.

### 5.2 v1: Guardrailed Actuation (later)

Once there is user-driven UX around review/confirmation, the MCP server MAY add tools for:
- starting/stopping preview sessions
- applying `OverrideOp[]` batches
- preview navigation (routes) where supported

All mutations MUST be validated against the same canonical schemas and invariants used by Skaffa’s UI flows.

---

## 6. Canonical Data Shapes (Re-use Existing Contracts)

The MCP server should re-use Skaffa’s shared v0 protocol shapes rather than inventing new ones.

Key joins (source of truth):
- `ComponentTypeId` is the join key across registry ↔ graph ↔ runtime adapter ↔ overrides.
- Runtime selection uses the `InstanceDescriptor` contract.

Relevant contracts:
- `docs/skaffa_runtime_adapter_contract.md`:
  - `InstanceDescriptor`
  - `OverrideOp[]`
- `docs/skaffa_component_registry_schema.md`:
  - `ComponentRegistry` (`schemaVersion: "v0"`)
- `docs/skaffa_project_graph_schema.md`:
  - `GraphPatch` / snapshot + `revision`
- `docs/skaffa_preview_session_protocol.md`:
  - preview session types, lifecycle, readiness

---

## 7. Resource Semantics (Read-Only v0)

v0 resources should reflect **effective state** (post-composition), not raw module contributions.

Recommended resources (names are illustrative; exact MCP naming can vary):
- `skaffa.server.info`  
  - Skaffa version, workspace root, schema versions supported, MCP features enabled.
- `skaffa.workspace.registry.effective`  
  - Effective `ComponentRegistry` for the loaded workspace.
- `skaffa.workspace.graph.snapshot`  
  - Current graph snapshot + revision.
- `skaffa.workspace.overrides.state`  
  - Current override model (including any orphaned overrides) and the persisted file representation.
- `skaffa.preview.sessions`  
  - Active sessions + targets + readiness states.
- `skaffa.preview.selection.current`  
  - Current selection per session (or active session), returning `selected: InstanceDescriptor | null`.

Enriched selection response SHOULD include:
- whether `componentTypeId` exists in the effective registry
- (optional) best-effort links to graph entities for the selected type/instance
- (optional) `source` when runtime adapters provide it

---

## 8. Non-Goals (v0)

- Exposing raw filesystem access to AI tools via MCP
- Letting MCP clients directly patch source files
- Letting MCP clients talk directly to preview runtime content
- Making MCP a replacement for the Workbench UI (it is an integration surface)
