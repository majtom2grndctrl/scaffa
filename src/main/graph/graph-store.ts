// ─────────────────────────────────────────────────────────────────────────────
// Project Graph Store (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Authoritative project graph store in main process.
// See: docs/skaffa_project_graph_schema.md

import type {
  GraphNode,
  GraphEdge,
  GraphPatch,
  GraphSnapshot,
  GraphRevision,
  GraphOp,
  RouteId,
  ComponentTypeId,
  PreviewSessionId,
  InstanceId,
} from "../../shared/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// Graph Store Types
// ─────────────────────────────────────────────────────────────────────────────

type NodeKey = string;

// ─────────────────────────────────────────────────────────────────────────────
// Project Graph Store
// ─────────────────────────────────────────────────────────────────────────────

export class ProjectGraphStore {
  private revision: GraphRevision = 0;
  private nodes = new Map<NodeKey, GraphNode>();
  private edges = new Set<string>(); // serialized edge for Set-based deduplication

  // Producer ownership tracking for snapshot replacement semantics
  private producerNodes = new Map<string, Set<NodeKey>>();
  private producerEdges = new Map<string, Set<string>>();

  /**
   * Get the current graph snapshot.
   */
  getSnapshot(): GraphSnapshot {
    return {
      schemaVersion: "v0",
      revision: this.revision,
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges).map((e) => JSON.parse(e)),
    };
  }

  /**
   * Apply a graph patch with global revision coordination.
   * Main assigns a global revision for every applied update, regardless of producer revision.
   * The producer revision in the patch is ignored (used only for producer-local ordering).
   */
  applyPatch(patch: GraphPatch): GraphRevision {
    // Assign next global revision
    const globalRevision = this.revision + 1;

    console.log(
      `[GraphStore] Applying patch (producer revision: ${patch.revision}, assigned global: ${globalRevision}, ${patch.ops.length} ops)`,
    );

    // Apply all operations in the patch
    for (const op of patch.ops) {
      this.applyOp(op);
    }

    // Update to the new global revision
    this.revision = globalRevision;
    return globalRevision;
  }

  /**
   * Apply a producer snapshot with full replacement semantics.
   * This is the correct way to ingest snapshots from graph producers.
   *
   * Replacement semantics:
   * - Nodes/edges in the snapshot are upserted
   * - Nodes/edges previously owned by this producer but not in the snapshot are removed
   * - Producer ownership is tracked to enable proper cleanup
   *
   * @param producerId - The ID of the producer sending the snapshot
   * @param snapshot - The graph snapshot from the producer
   * @returns Object containing the assigned global revision and the patch that was applied
   */
  applySnapshot(
    producerId: string,
    snapshot: GraphSnapshot,
  ): { globalRevision: GraphRevision; patch: GraphPatch } {
    console.log(
      `[GraphStore] Applying snapshot from producer: ${producerId} (producer revision: ${snapshot.revision}, ${snapshot.nodes.length} nodes, ${snapshot.edges.length} edges)`,
    );

    // Get existing nodes/edges owned by this producer
    const existingNodeKeys =
      this.producerNodes.get(producerId) ?? new Set<NodeKey>();
    const existingEdgeKeys =
      this.producerEdges.get(producerId) ?? new Set<string>();

    // Compute new node/edge keys from snapshot
    const newNodeKeys = new Set(
      snapshot.nodes.map((node) => this.makeNodeKey(node)),
    );
    const newEdgeKeys = new Set(
      snapshot.edges.map((edge) => this.makeEdgeKey(edge)),
    );

    // Compute nodes/edges to remove (in existing but not in new)
    const nodesToRemove = Array.from(existingNodeKeys).filter(
      (key) => !newNodeKeys.has(key),
    );
    const edgesToRemove = Array.from(existingEdgeKeys).filter(
      (key) => !newEdgeKeys.has(key),
    );

    // Build patch operations
    const ops: GraphOp[] = [
      // Remove operations for nodes/edges no longer in snapshot
      ...nodesToRemove.map((key) => {
        const node = this.nodes.get(key);
        if (!node) {
          throw new Error(`[GraphStore] Cannot remove node ${key}: not found`);
        }
        return { op: "removeNode" as const, node: this.makeNodeRef(node) };
      }),
      ...edgesToRemove.map((key) => {
        const edge = JSON.parse(key) as GraphEdge;
        return { op: "removeEdge" as const, edge };
      }),
      // Upsert operations for all nodes/edges in snapshot
      ...snapshot.nodes.map((node) => ({ op: "upsertNode" as const, node })),
      ...snapshot.edges.map((edge) => ({ op: "upsertEdge" as const, edge })),
    ];

    // Apply the patch (assigns global revision)
    const patch: GraphPatch = {
      schemaVersion: snapshot.schemaVersion,
      revision: snapshot.revision, // Producer-local; replaced with global by applyPatch
      ops,
    };
    const globalRevision = this.applyPatch(patch);

    // Update producer ownership tracking
    this.producerNodes.set(producerId, newNodeKeys);
    this.producerEdges.set(producerId, newEdgeKeys);

    console.log(
      `[GraphStore] Snapshot applied: ${nodesToRemove.length} nodes removed, ${snapshot.nodes.length} nodes upserted, ${edgesToRemove.length} edges removed, ${snapshot.edges.length} edges upserted`,
    );

    // Return both the global revision and the patch with global revision
    const appliedPatch: GraphPatch = {
      ...patch,
      revision: globalRevision,
    };

    return { globalRevision, patch: appliedPatch };
  }

  /**
   * Get a specific node by key.
   */
  getNode(
    nodeRef:
      | { kind: "route"; id: RouteId }
      | { kind: "componentType"; id: ComponentTypeId }
      | {
          kind: "instance";
          sessionId: PreviewSessionId;
          instanceId: InstanceId;
        },
  ): GraphNode | null {
    const key = this.makeNodeKey(nodeRef);
    return this.nodes.get(key) ?? null;
  }

  /**
   * Reset the graph (used for testing or workspace changes).
   */
  reset(): void {
    this.revision = 0;
    this.nodes.clear();
    this.edges.clear();
    this.producerNodes.clear();
    this.producerEdges.clear();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Apply a single graph operation.
   */
  private applyOp(op: GraphOp): void {
    switch (op.op) {
      case "upsertNode":
        this.upsertNode(op.node);
        break;

      case "removeNode":
        this.removeNode(op.node);
        break;

      case "upsertEdge":
        this.upsertEdge(op.edge);
        break;

      case "removeEdge":
        this.removeEdge(op.edge);
        break;
    }
  }

  /**
   * Upsert a node (insert or update).
   */
  private upsertNode(node: GraphNode): void {
    const key = this.makeNodeKey(node);
    this.nodes.set(key, node);
    console.log(`[GraphStore] Upserted node: ${key}`);
  }

  /**
   * Remove a node.
   */
  private removeNode(
    nodeRef:
      | { kind: "route"; id: RouteId }
      | { kind: "componentType"; id: ComponentTypeId }
      | {
          kind: "instance";
          sessionId: PreviewSessionId;
          instanceId: InstanceId;
        },
  ): void {
    const key = this.makeNodeKey(nodeRef);
    const existed = this.nodes.delete(key);
    if (existed) {
      console.log(`[GraphStore] Removed node: ${key}`);
    }
  }

  /**
   * Upsert an edge (insert or update).
   */
  private upsertEdge(edge: GraphEdge): void {
    const key = this.makeEdgeKey(edge);
    this.edges.add(key);
    console.log(`[GraphStore] Upserted edge: ${edge.kind}`);
  }

  /**
   * Remove an edge.
   */
  private removeEdge(edge: GraphEdge): void {
    const key = this.makeEdgeKey(edge);
    const existed = this.edges.delete(key);
    if (existed) {
      console.log(`[GraphStore] Removed edge: ${edge.kind}`);
    }
  }

  /**
   * Make a unique key for a node.
   */
  private makeNodeKey(
    node:
      | { kind: "route"; id: RouteId }
      | { kind: "componentType"; id: ComponentTypeId }
      | {
          kind: "instance";
          sessionId: PreviewSessionId;
          instanceId: InstanceId;
        },
  ): NodeKey {
    switch (node.kind) {
      case "route":
        return `route:${node.id}`;
      case "componentType":
        return `componentType:${node.id}`;
      case "instance":
        return `instance:${node.sessionId}:${node.instanceId}`;
    }
  }

  /**
   * Convert a GraphNode to a node reference for remove operations.
   */
  private makeNodeRef(
    node: GraphNode,
  ):
    | { kind: "route"; id: RouteId }
    | { kind: "componentType"; id: ComponentTypeId }
    | {
        kind: "instance";
        sessionId: PreviewSessionId;
        instanceId: InstanceId;
      } {
    switch (node.kind) {
      case "route":
        return { kind: "route", id: node.id };
      case "componentType":
        return { kind: "componentType", id: node.id };
      case "instance":
        return {
          kind: "instance",
          sessionId: node.sessionId,
          instanceId: node.instanceId,
        };
    }
  }

  /**
   * Make a unique key for an edge.
   * We serialize the edge as JSON for Set-based deduplication.
   */
  private makeEdgeKey(edge: GraphEdge): string {
    return JSON.stringify(edge);
  }
}

// Singleton instance
export const projectGraphStore = new ProjectGraphStore();
