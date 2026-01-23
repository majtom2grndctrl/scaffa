/**
 * Graph Snapshot Integration Tests
 *
 * These tests verify the complete graph snapshot ingestion flow:
 *
 *   Extension Host (graph-snapshot) → Main Process (graph-store) → Renderer (via IPC)
 *
 * This is a critical Scaffa workflow:
 * - Graph producers send snapshots during initialization
 * - Main process ingests snapshots with producer-scoped replacement semantics
 * - Renderer receives patches reflecting the snapshot changes
 *
 * Key invariant: Snapshots from a producer replace only that producer's nodes/edges.
 * If this flow breaks, the Routes and Project Graph panels will show stale/incorrect data.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectGraphStore } from './graph-store.js';
import type { GraphSnapshot } from '../../shared/index.js';

describe('Graph Snapshot Integration', () => {
  let store: ProjectGraphStore;

  beforeEach(() => {
    store = new ProjectGraphStore();
    store.reset();
  });

  describe('Single Producer Snapshot', () => {
    it('should ingest a snapshot and populate the graph', () => {
      // Arrange
      const producerId = 'react-router-producer';
      const snapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          { kind: 'route', id: 'route:/about', path: '/about' },
          { kind: 'componentType', id: 'ui.Button', displayName: 'Button' },
        ],
        edges: [
          { kind: 'routeUsesComponentType', routeId: 'route:/', componentTypeId: 'ui.Button' },
        ],
      };

      // Act
      const result = store.applySnapshot(producerId, snapshot);

      // Assert
      expect(result.globalRevision).toBe(1);
      expect(result.patch.ops).toHaveLength(4); // 3 nodes + 1 edge

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(3);
      expect(currentSnapshot.edges).toHaveLength(1);
      expect(currentSnapshot.revision).toBe(1);
    });

    it('should replace producer nodes on subsequent snapshot', () => {
      // Arrange
      const producerId = 'react-router-producer';
      const firstSnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          { kind: 'route', id: 'route:/about', path: '/about' },
          { kind: 'componentType', id: 'ui.Button', displayName: 'Button' },
        ],
        edges: [],
      };

      const secondSnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 2,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' }, // Kept
          { kind: 'route', id: 'route:/contact', path: '/contact' }, // New
          // ui.Button removed, /about removed
        ],
        edges: [],
      };

      // Act
      store.applySnapshot(producerId, firstSnapshot);
      const result = store.applySnapshot(producerId, secondSnapshot);

      // Assert
      expect(result.globalRevision).toBe(2);

      // Should have remove ops for /about and Button, upsert ops for / and /contact
      const removeOps = result.patch.ops.filter((op) => op.op === 'removeNode');
      const upsertOps = result.patch.ops.filter((op) => op.op === 'upsertNode');

      expect(removeOps).toHaveLength(2); // /about and Button removed
      expect(upsertOps).toHaveLength(2); // / and /contact upserted

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(2); // Only / and /contact
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/')).toBeDefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/contact')).toBeDefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/about')).toBeUndefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'componentType' && n.id === 'ui.Button')).toBeUndefined();
    });

    it('should handle empty snapshot from producer', () => {
      // Arrange
      const producerId = 'react-router-producer';
      const firstSnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
        ],
        edges: [],
      };

      const emptySnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 2,
        nodes: [],
        edges: [],
      };

      // Act
      store.applySnapshot(producerId, firstSnapshot);
      const result = store.applySnapshot(producerId, emptySnapshot);

      // Assert
      expect(result.globalRevision).toBe(2);

      const removeOps = result.patch.ops.filter((op) => op.op === 'removeNode');
      expect(removeOps).toHaveLength(1); // Remove /

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(0);
    });
  });

  describe('Multi-Producer Isolation', () => {
    it('should isolate snapshots from different producers', () => {
      // Arrange
      const producerA = 'react-router-producer';
      const producerB = 'mui-registry';

      const snapshotA: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
        ],
        edges: [],
      };

      const snapshotB: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'componentType', id: 'mui.Button', displayName: 'MUI Button' },
        ],
        edges: [],
      };

      // Act
      store.applySnapshot(producerA, snapshotA);
      store.applySnapshot(producerB, snapshotB);

      // Assert
      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(2);
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/')).toBeDefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'componentType' && n.id === 'mui.Button')).toBeDefined();
    });

    it('should only remove nodes from the updating producer', () => {
      // Arrange
      const producerA = 'react-router-producer';
      const producerB = 'mui-registry';

      const snapshotA1: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          { kind: 'route', id: 'route:/about', path: '/about' },
        ],
        edges: [],
      };

      const snapshotB: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'componentType', id: 'mui.Button', displayName: 'MUI Button' },
        ],
        edges: [],
      };

      const snapshotA2: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 2,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          // /about removed
        ],
        edges: [],
      };

      // Act
      store.applySnapshot(producerA, snapshotA1);
      store.applySnapshot(producerB, snapshotB);
      const result = store.applySnapshot(producerA, snapshotA2);

      // Assert
      const removeOps = result.patch.ops.filter((op) => op.op === 'removeNode');
      expect(removeOps).toHaveLength(1); // Only /about removed

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(2); // / and mui.Button
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/')).toBeDefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'componentType' && n.id === 'mui.Button')).toBeDefined();
      expect(currentSnapshot.nodes.find((n) => n.kind === 'route' && n.id === 'route:/about')).toBeUndefined();
    });

    it('should handle same revision from multiple producers', () => {
      // Arrange - Producer revisions are local, not global
      const producerA = 'producer-a';
      const producerB = 'producer-b';

      const snapshotA: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1, // Producer-local revision
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
        ],
        edges: [],
      };

      const snapshotB: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1, // Same producer-local revision, different producer
        nodes: [
          { kind: 'route', id: 'route:/about', path: '/about' },
        ],
        edges: [],
      };

      // Act
      const resultA = store.applySnapshot(producerA, snapshotA);
      const resultB = store.applySnapshot(producerB, snapshotB);

      // Assert - Global revisions should be different despite same producer revision
      expect(resultA.globalRevision).toBe(1);
      expect(resultB.globalRevision).toBe(2);

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.nodes).toHaveLength(2);
      expect(currentSnapshot.revision).toBe(2); // Global revision
    });
  });

  describe('Edge Handling', () => {
    it('should remove edges owned by producer on snapshot update', () => {
      // Arrange
      const producerId = 'react-router-producer';
      const firstSnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 1,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          { kind: 'componentType', id: 'ui.Button', displayName: 'Button' },
        ],
        edges: [
          { kind: 'routeUsesComponentType', routeId: 'route:/', componentTypeId: 'ui.Button' },
        ],
      };

      const secondSnapshot: GraphSnapshot = {
        schemaVersion: 'v0',
        revision: 2,
        nodes: [
          { kind: 'route', id: 'route:/', path: '/' },
          { kind: 'componentType', id: 'ui.Button', displayName: 'Button' },
        ],
        edges: [], // Edge removed
      };

      // Act
      store.applySnapshot(producerId, firstSnapshot);
      const result = store.applySnapshot(producerId, secondSnapshot);

      // Assert
      const removeEdgeOps = result.patch.ops.filter((op) => op.op === 'removeEdge');
      expect(removeEdgeOps).toHaveLength(1);

      const currentSnapshot = store.getSnapshot();
      expect(currentSnapshot.edges).toHaveLength(0);
    });
  });
});
