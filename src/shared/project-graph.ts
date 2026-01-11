import { z } from 'zod';
import {
  PreviewSessionIdSchema,
  InstanceIdSchema,
  ComponentTypeIdSchema,
  type PreviewSessionId,
  type InstanceId,
  type ComponentTypeId,
} from './preview-session.js';
import { SourceRefSchema, type SourceRef } from './common.js';

// ─────────────────────────────────────────────────────────────────────────────
// Project Graph Schema (v0)
// ─────────────────────────────────────────────────────────────────────────────
// See: docs/scaffa_project_graph_schema.md

export const GraphRevisionSchema = z.number().int().nonnegative();
export type GraphRevision = z.infer<typeof GraphRevisionSchema>;

export const GraphSchemaVersionSchema = z.literal('v0');
export type GraphSchemaVersion = z.infer<typeof GraphSchemaVersionSchema>;

export const RouteIdSchema = z.string().brand('RouteId');
export type RouteId = z.infer<typeof RouteIdSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Nodes
// ─────────────────────────────────────────────────────────────────────────────

export const GraphNodeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('route'),
    id: RouteIdSchema,
    path: z.string(),
    source: SourceRefSchema.optional(),
  }),
  z.object({
    kind: z.literal('componentType'),
    id: ComponentTypeIdSchema,
    displayName: z.string(),
    source: SourceRefSchema.optional(),
  }),
  z.object({
    kind: z.literal('instance'),
    sessionId: PreviewSessionIdSchema,
    instanceId: InstanceIdSchema,
    componentTypeId: ComponentTypeIdSchema,
    displayName: z.string().optional(),
    source: SourceRefSchema.optional(),
  }),
]);

export type GraphNode = z.infer<typeof GraphNodeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Edges
// ─────────────────────────────────────────────────────────────────────────────

export const GraphEdgeSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('routeUsesComponentType'),
    routeId: RouteIdSchema,
    componentTypeId: ComponentTypeIdSchema,
  }),
  z.object({
    kind: z.literal('componentTypeUsesComponentType'),
    from: ComponentTypeIdSchema,
    to: ComponentTypeIdSchema,
  }),
  z.object({
    kind: z.literal('instanceChildOfInstance'),
    sessionId: PreviewSessionIdSchema,
    parentInstanceId: InstanceIdSchema,
    childInstanceId: InstanceIdSchema,
  }),
]);

export type GraphEdge = z.infer<typeof GraphEdgeSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Operations
// ─────────────────────────────────────────────────────────────────────────────

export const GraphOpSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('upsertNode'),
    node: GraphNodeSchema,
  }),
  z.object({
    op: z.literal('removeNode'),
    node: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('route'),
        id: RouteIdSchema,
      }),
      z.object({
        kind: z.literal('componentType'),
        id: ComponentTypeIdSchema,
      }),
      z.object({
        kind: z.literal('instance'),
        sessionId: PreviewSessionIdSchema,
        instanceId: InstanceIdSchema,
      }),
    ]),
  }),
  z.object({
    op: z.literal('upsertEdge'),
    edge: GraphEdgeSchema,
  }),
  z.object({
    op: z.literal('removeEdge'),
    edge: GraphEdgeSchema,
  }),
]);

export type GraphOp = z.infer<typeof GraphOpSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Patch
// ─────────────────────────────────────────────────────────────────────────────

export const GraphPatchSchema = z.object({
  schemaVersion: GraphSchemaVersionSchema,
  revision: GraphRevisionSchema,
  ops: z.array(GraphOpSchema),
});

export type GraphPatch = z.infer<typeof GraphPatchSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Snapshot
// ─────────────────────────────────────────────────────────────────────────────

export const GraphSnapshotSchema = z.object({
  schemaVersion: GraphSchemaVersionSchema,
  revision: GraphRevisionSchema,
  nodes: z.array(GraphNodeSchema),
  edges: z.array(GraphEdgeSchema),
});

export type GraphSnapshot = z.infer<typeof GraphSnapshotSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// Graph Query
// ─────────────────────────────────────────────────────────────────────────────

export const GraphQuerySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('getSnapshot'),
  }),
  z.object({
    type: z.literal('getNode'),
    node: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('route'),
        id: RouteIdSchema,
      }),
      z.object({
        kind: z.literal('componentType'),
        id: ComponentTypeIdSchema,
      }),
    ]),
  }),
]);

export type GraphQuery = z.infer<typeof GraphQuerySchema>;
