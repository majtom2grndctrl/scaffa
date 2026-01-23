# Scaffa Project Graph Schema + Patch Protocol (v0)

> **Status:** Draft / v0 shape  
> **Audience:** Scaffa core contributors and adapter/extension authors  
> **Goal:** Define the canonical Project Graph entities, ID strategy, and patch/update semantics used across the extension API boundary.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Extension API – v0 Sketch](./scaffa_extension_api.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)

---

## 1. Purpose

Scaffa maintains a **framework-agnostic Project Graph** as canonical truth about the workspace and (optionally) about runtime instance state.

The graph must support:
- building UI surfaces (Routes, Component Tree, Inspector context)
- powering extensions (registries, adapters, workflows)
- incremental updates via patches

---

## 2. Entity Model (v0)

v0 distinguishes:
- **workspace-scoped entities** (routes, component types)
- **session-scoped entities** (runtime instances tied to a preview session)

```ts
export type GraphRevision = number; // monotonic

export type RouteId = string; // e.g. "route:/" or a stable internal id
export type ComponentTypeId = string; // e.g. "ui.button"

export type PreviewSessionId = string;
export type InstanceId = string; // session-scoped

export type SourceRef = {
  filePath: string;
  line: number; // 1-based
  column?: number; // 1-based
};

export type GraphNode =
  | {
      kind: "route";
      id: RouteId;
      path: string; // e.g. "/settings"
      source?: SourceRef;
    }
  | {
      kind: "componentType";
      id: ComponentTypeId;
      displayName: string;
      source?: SourceRef;
    }
  | {
      // Optional in v0; used when runtime adapters emit instance identity.
      kind: "instance";
      sessionId: PreviewSessionId;
      instanceId: InstanceId;
      componentTypeId: ComponentTypeId;
      displayName?: string;
      source?: SourceRef;
    };

export type GraphEdge =
  | { kind: "routeUsesComponentType"; routeId: RouteId; componentTypeId: ComponentTypeId }
  | { kind: "componentTypeUsesComponentType"; from: ComponentTypeId; to: ComponentTypeId }
  | {
      kind: "instanceChildOfInstance";
      sessionId: PreviewSessionId;
      parentInstanceId: InstanceId;
      childInstanceId: InstanceId;
    };
```

Notes:
- The `instance` node is session-scoped; it should not be required for v0 to ship, but the schema reserves it.
- `componentTypeUsesComponentType` is useful for type-level trees; `instanceChildOfInstance` is runtime-only.

---

## 3. ID Strategy and Versioning

### 3.1 Type IDs

`ComponentTypeId` MUST be stable across:
- registries
- runtime adapters
- overrides
- graph

In practice, `ComponentTypeId` is the join key that lets a selected runtime instance map to Inspector metadata.

### 3.2 Route IDs

`RouteId` SHOULD be stable enough to join:
- the Routes panel selection/highlighting
- any runtime-emitted "active route" state (e.g. matched route ids)

**RouteId Encoding Strategy:**

1. **Explicit Router IDs (recommended)**: When the router provides explicit route identifiers (e.g., React Router `route.id`), use `routeId:{explicitId}` format.
   - Example: `routeId:dashboard-route` for a route with `id: "dashboard-route"`
   - Guarantees stability even when paths are reused or routes are reordered

2. **Path-derived IDs (fallback)**: When explicit ids are unavailable, use `route:{path}` format.
   - Example: `route:/dashboard` for a route with `path: "/dashboard"`
   - Works for simple cases but has limitations with index routes and dynamic composition

Graph producers should prefer strategy 1 when available. The `createRouteNode` helper accepts an optional `routeId` parameter for explicit ids.

**Backward Compatibility and Mixed ID Formats:**

Both `routeId:` and `route:` ID formats coexist in the same graph. This is intentional:
- Producers using explicit router IDs emit `routeId:{explicitId}` nodes
- Producers without explicit IDs (e.g., sample/demo producers) emit `route:{path}` nodes
- Consumers (renderer, extensions) MUST handle both formats transparently

When joining or matching RouteIds:
- Treat the prefix (`routeId:` vs `route:`) as part of the identifier
- Do not attempt to normalize or convert between formats
- For path-based lookups, use the `node.path` field (always present) rather than parsing the ID

### 3.3 Instance IDs

`InstanceId` is only guaranteed stable within a session; stability across reloads is adapter-dependent.

If stability cannot be guaranteed, consumers MUST tolerate orphaning:
- overrides may fail to apply (see `docs/scaffa_override_model.md`)
- instance graph nodes may churn on reload

### 3.4 Schema Versioning

Graph snapshots and patches MUST declare a schema version:

```ts
export type GraphSchemaVersion = "v0";
```

---

## 4. Query Model (GraphQuery)

v0 can be intentionally minimal:

- `getSnapshot`: return the full graph snapshot
- `getNode`: return a specific node

```ts
export type GraphQuery =
  | { type: "getSnapshot" }
  | { type: "getNode"; node: { kind: "route"; id: RouteId } }
  | { type: "getNode"; node: { kind: "componentType"; id: ComponentTypeId } };
```

---

## 5. Patch Model (GraphPatch)

Adapters produce patches; consumers apply them.

Minimum patch semantics:
- patches are **ordered** by `revision`
- patches are **idempotent** when applied in order
- consumers may receive a full snapshot followed by patches

```ts
export type GraphPatch = {
  schemaVersion: "v0";
  revision: GraphRevision;
  ops: GraphOp[];
};

export type GraphOp =
  | { op: "upsertNode"; node: GraphNode }
  | { op: "removeNode"; node: { kind: "route"; id: RouteId } }
  | { op: "removeNode"; node: { kind: "componentType"; id: ComponentTypeId } }
  | {
      op: "removeNode";
      node: { kind: "instance"; sessionId: PreviewSessionId; instanceId: InstanceId };
    }
  | { op: "upsertEdge"; edge: GraphEdge }
  | { op: "removeEdge"; edge: GraphEdge };
```

### 5.1 Delivery Guarantees (v0)

Required:
- Patches are delivered in **revision order** per workspace.
- Consumers can ignore patches with `revision <= lastSeenRevision`.

Not guaranteed in v0:
- exactly-once delivery (consumers should handle duplicates)
- persistence of patch history across app restarts (snapshots handle that)

### 5.2 Global Revision Coordination

**For extension authors:**

Graph producers emit patches with their own local revision counters (starting at 1 per producer). The main process assigns a **global revision** to every applied update, regardless of the producer's local revision.

- **Producer revision**: used only for producer-local ordering and diagnostics
- **Global revision**: assigned by main, monotonic across all producers, used by consumers

**Implementation:**
- Producers should maintain local revision counters starting at 1 and increment on each patch
- Main process assigns the next global revision when ingesting snapshots/patches
- Renderer and other consumers receive patches with the global revision only
- Multiple producers can emit `revision: 1` without collision; main assigns distinct global revisions

---

## 6. Example Patch Payload

```json
{
  "schemaVersion": "v0",
  "revision": 42,
  "ops": [
    {
      "op": "upsertNode",
      "node": { "kind": "route", "id": "route:/", "path": "/" }
    },
    {
      "op": "upsertNode",
      "node": { "kind": "componentType", "id": "ui.button", "displayName": "Button" }
    },
    {
      "op": "upsertEdge",
      "edge": { "kind": "routeUsesComponentType", "routeId": "route:/", "componentTypeId": "ui.button" }
    }
  ]
}
```

---

## 7. Producer / Consumer Roles

Producers (framework adapters) MUST:
- emit a snapshot at startup (or provide `getSnapshot`)
- emit ordered patches reflecting workspace changes
- maintain a local revision counter starting at 1 (incremented per patch)
- understand that the producer revision is for local ordering only; main assigns global revisions

Consumers (renderer, extensions) MUST:
- treat the graph as canonical truth
- tolerate partial graphs in v0 (some nodes/edges may be unavailable until adapters mature)
- use only the global revision provided by main (never the producer revision)

---

## 8. Non-Goals (v0)

- A full general-purpose query language
- Strong transactional semantics across multiple producers
- Persisting a complete graph history for time-travel
