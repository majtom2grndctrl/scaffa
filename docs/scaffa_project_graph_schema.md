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

### 3.2 Instance IDs

`InstanceId` is only guaranteed stable within a session; stability across reloads is adapter-dependent.

If stability cannot be guaranteed, consumers MUST tolerate orphaning:
- overrides may fail to apply (see `docs/scaffa_override_model.md`)
- instance graph nodes may churn on reload

### 3.3 Schema Versioning

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

Consumers (renderer, extensions) MUST:
- treat the graph as canonical truth
- tolerate partial graphs in v0 (some nodes/edges may be unavailable until adapters mature)

---

## 8. Non-Goals (v0)

- A full general-purpose query language
- Strong transactional semantics across multiple producers
- Persisting a complete graph history for time-travel
