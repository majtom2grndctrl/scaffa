# Iteration Deck Integration Sketch (Conceptual)

> **Status:** Concept / deferred (not v0)  
> **Audience:** Scaffa core contributors and product/design stakeholders  
> **Goal:** Provide a compatibility sketch so v0 contracts (sessions, overrides, registries, graph) don’t block variants/snapshots/comparisons later.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)
- [Scaffa Project Graph Schema + Patch Protocol](./scaffa_project_graph_schema.md)

---

## 1. What “Iteration Deck” Means

Iteration Deck is a future surface that allows teams to:
- create **variants** of a UI state
- capture **snapshots** of those variants
- compare variants/snapshots (visual + semantic diffs)

Iteration Deck is explicitly **out of scope for v0**, but v0 must preserve the option.

---

## 2. Core Concepts (Future)

### 2.1 Variant

A **Variant** is a named, serializable layer of overrides + context.

Conceptually:
- Variant = `{ context + overrideSet }`
- “context” includes which preview target (route/component) and any decorators/environment
- overrideSet uses the same canonical model as v0 overrides

### 2.2 Snapshot

A **Snapshot** is an immutable capture of a variant at a point in time:
- screenshot(s)
- metadata (timestamp, commit SHA, viewport)
- optional semantic capture (graph snapshot, instance map)

### 2.3 Comparison

A **Comparison** is a diff between two snapshots/variants:
- pixel diffs (image-based)
- semantic diffs (overrides, registry diffs, graph diffs)

---

## 3. How It Layers on v0 Primitives

### 3.1 Preview Sessions

Iteration Deck builds on preview sessions:
- a variant can be represented as a `variant` session type, or
- as an `app/component` session with a `variantId` context attached

Key requirement:
- session protocol must support applying a named override set at startup and after reload.

### 3.2 Override Model

The override model must support:
- multiple layers (config, user, variant, experiment)
- stable serialization of overrides
- deterministic precedence

Key requirement:
- overrides must be addressable in a way that can survive reloads and be re-applied.

### 3.3 Component Registries

Registries define:
- what controls exist
- how to interpret override values

Key requirement:
- stable `ComponentTypeId` values and stable control semantics across time.

### 3.4 Project Graph

The graph enables:
- anchoring snapshots to routes/components/types
- richer diffs than pixels alone

Key requirement:
- graph schema versioning + patch semantics that allow snapshotting a coherent “graph state.”

---

## 4. v0 Invariants to Preserve Compatibility

To keep Iteration Deck possible, v0 contracts should preserve these invariants:

1. **Stable Type IDs everywhere** (`ComponentTypeId` is the join key across registry/graph/runtime/overrides).
2. **Override addressing is serializable** (no opaque closures or runtime-only pointers).
3. **Session handshake supports re-application** of overrides after reload/reconnect.
4. **Graph patches are versioned and ordered** so a coherent snapshot can be reconstructed.

---

## 5. Explicit Non-Goals (This Doc)

- Defining the Iteration Deck UI
- Designing storage/backends for snapshots
- Defining a diff algorithm
