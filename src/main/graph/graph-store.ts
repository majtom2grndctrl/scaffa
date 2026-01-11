// ─────────────────────────────────────────────────────────────────────────────
// Project Graph Store (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Authoritative project graph store in main process.
// See: docs/scaffa_project_graph_schema.md

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
} from '../../shared/index.js';

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

  /**
   * Get the current graph snapshot.
   */
  getSnapshot(): GraphSnapshot {
    return {
      schemaVersion: 'v0',
      revision: this.revision,
      nodes: Array.from(this.nodes.values()),
      edges: Array.from(this.edges).map((e) => JSON.parse(e)),
    };
  }

  /**
   * Apply a graph patch.
   * Patches are idempotent and ordered by revision.
   * Duplicate or out-of-order patches are ignored.
   */
  applyPatch(patch: GraphPatch): boolean {
    // Ignore patches with revision <= current revision (duplicate/out-of-order)
    if (patch.revision <= this.revision) {
      console.log(
        `[GraphStore] Ignoring patch with revision ${patch.revision} (current: ${this.revision})`
      );
      return false;
    }

    console.log(
      `[GraphStore] Applying patch with revision ${patch.revision} (${patch.ops.length} ops)`
    );

    // Apply all operations in the patch
    for (const op of patch.ops) {
      this.applyOp(op);
    }

    // Update revision
    this.revision = patch.revision;
    return true;
  }

  /**
   * Get a specific node by key.
   */
  getNode(
    nodeRef:
      | { kind: 'route'; id: RouteId }
      | { kind: 'componentType'; id: ComponentTypeId }
      | { kind: 'instance'; sessionId: PreviewSessionId; instanceId: InstanceId }
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
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private methods
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Apply a single graph operation.
   */
  private applyOp(op: GraphOp): void {
    switch (op.op) {
      case 'upsertNode':
        this.upsertNode(op.node);
        break;

      case 'removeNode':
        this.removeNode(op.node);
        break;

      case 'upsertEdge':
        this.upsertEdge(op.edge);
        break;

      case 'removeEdge':
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
      | { kind: 'route'; id: RouteId }
      | { kind: 'componentType'; id: ComponentTypeId }
      | { kind: 'instance'; sessionId: PreviewSessionId; instanceId: InstanceId }
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
      | { kind: 'route'; id: RouteId }
      | { kind: 'componentType'; id: ComponentTypeId }
      | { kind: 'instance'; sessionId: PreviewSessionId; instanceId: InstanceId }
  ): NodeKey {
    switch (node.kind) {
      case 'route':
        return `route:${node.id}`;
      case 'componentType':
        return `componentType:${node.id}`;
      case 'instance':
        return `instance:${node.sessionId}:${node.instanceId}`;
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
