// ─────────────────────────────────────────────────────────────────────────────
// Project Graph Store (Renderer)
// ─────────────────────────────────────────────────────────────────────────────
// Maintains a local copy of the project graph, synchronized with main via IPC.

import { create } from 'zustand';
import type { GraphSnapshot, GraphPatch, GraphNode } from '../../shared/index.js';

interface GraphState {
  snapshot: GraphSnapshot | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  refresh: () => Promise<void>;
  applyPatch: (patch: GraphPatch) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  snapshot: null,
  isLoading: false,
  isInitialized: false,

  /**
   * Initialize the graph by fetching the current snapshot and subscribing to patches.
   */
  initialize: async () => {
    if (get().isInitialized) {
      await get().refresh();
      return;
    }

    set({ isLoading: true });

    try {
      // Fetch initial snapshot
      const snapshot = await window.scaffa.graph.getSnapshot({});
      console.log('[GraphStore] Initialized with snapshot:', snapshot);
      set({ snapshot, isLoading: false, isInitialized: true });

      // Subscribe to patches
      window.scaffa.graph.onPatch((patch) => {
        console.log('[GraphStore] Received patch:', patch);
        get().applyPatch(patch);
      });
    } catch (error) {
      console.error('[GraphStore] Failed to initialize:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Refresh the graph snapshot without re-subscribing to patches.
   */
  refresh: async () => {
    set({ isLoading: true });
    try {
      const snapshot = await window.scaffa.graph.getSnapshot({});
      console.log('[GraphStore] Refreshed snapshot:', snapshot);
      set({ snapshot, isLoading: false });
    } catch (error) {
      console.error('[GraphStore] Failed to refresh:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Apply a patch to the current snapshot.
   * Patches are idempotent and ordered by revision.
   */
  applyPatch: (patch: GraphPatch) => {
    const current = get().snapshot;
    if (!current) {
      console.warn('[GraphStore] Cannot apply patch: no snapshot loaded');
      return;
    }

    // Ignore patches with revision <= current revision (duplicate/out-of-order)
    if (patch.revision <= current.revision) {
      console.log(
        `[GraphStore] Ignoring patch with revision ${patch.revision} (current: ${current.revision})`
      );
      return;
    }

    // Apply patch operations to create new snapshot
    const nodes = new Map<string, GraphNode>();
    const edges = new Set<string>();

    // Start with current snapshot
    current.nodes.forEach((node) => {
      nodes.set(makeNodeKey(node), node);
    });
    current.edges.forEach((edge) => {
      edges.add(JSON.stringify(edge));
    });

    // Apply patch operations
    for (const op of patch.ops) {
      switch (op.op) {
        case 'upsertNode': {
          const key = makeNodeKey(op.node);
          nodes.set(key, op.node);
          break;
        }

        case 'removeNode': {
          const key = makeNodeKey(op.node);
          nodes.delete(key);
          break;
        }

        case 'upsertEdge': {
          const key = JSON.stringify(op.edge);
          edges.add(key);
          break;
        }

        case 'removeEdge': {
          const key = JSON.stringify(op.edge);
          edges.delete(key);
          break;
        }
      }
    }

    // Create new snapshot
    const newSnapshot: GraphSnapshot = {
      schemaVersion: 'v0',
      revision: patch.revision,
      nodes: Array.from(nodes.values()),
      edges: Array.from(edges).map((e) => JSON.parse(e)),
    };

    console.log(
      `[GraphStore] Applied patch revision ${patch.revision} (${patch.ops.length} ops)`
    );
    set({ snapshot: newSnapshot });
  },

  /**
   * Reset the graph store.
   */
  reset: () => {
    set({ snapshot: null, isLoading: false });
  },
}));

/**
 * Make a unique key for a node.
 */
function makeNodeKey(
  node:
    | { kind: 'route'; id: string }
    | { kind: 'componentType'; id: string }
    | { kind: 'instance'; sessionId: string; instanceId: string }
): string {
  switch (node.kind) {
    case 'route':
      return `route:${node.id}`;
    case 'componentType':
      return `componentType:${node.id}`;
    case 'instance':
      return `instance:${node.sessionId}:${node.instanceId}`;
  }
}
