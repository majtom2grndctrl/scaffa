// ─────────────────────────────────────────────────────────────────────────────
// Graph Construction Helpers (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Ergonomic helpers for extension authors to construct graph nodes and edges
// without pervasive `as any` casts for branded types.
//
// Usage:
//   import { createRouteNode, createComponentTypeNode, createRouteUsesComponentTypeEdge } from '../../extension-sdk.js';
//
//   const nodes = [
//     // With explicit router id (recommended when available)
//     createRouteNode({ path: '/', routeId: 'root-route', filePath: 'src/app/page.tsx', line: 1 }),
//     // Or without explicit id (falls back to path-based id)
//     createRouteNode({ path: '/about', filePath: 'src/app/about/page.tsx', line: 1 }),
//     createComponentTypeNode({ id: 'ui.button', displayName: 'Button', filePath: 'src/components/Button.tsx', line: 5 }),
//   ];
//
//   const edges = [
//     createRouteUsesComponentTypeEdge({ routePath: '/', componentTypeId: 'ui.button' }),
//   ];

import {
  ComponentTypeIdSchema,
  RouteIdSchema,
} from '../shared/index.js';
import type {
  RouteNode,
  ComponentTypeNode,
  RouteUsesComponentTypeEdge,
  ComponentTypeUsesComponentTypeEdge,
  ComponentTypeId,
  RouteId,
} from '../shared/project-graph.js';

// ─────────────────────────────────────────────────────────────────────────────
// Branded ID Constructors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a RouteId from a path string.
 * @param path - Route path (e.g., '/', '/about')
 * @returns Branded RouteId
 * @throws ZodError if path is invalid
 */
export function createRouteId(path: string): RouteId {
  return RouteIdSchema.parse(`route:${path}`);
}

/**
 * Create a ComponentTypeId from an ID string.
 * @param id - Component type ID (e.g., 'ui.button', 'layout.header')
 * @returns Branded ComponentTypeId
 * @throws ZodError if id is invalid
 */
export function createComponentTypeId(id: string): ComponentTypeId {
  return ComponentTypeIdSchema.parse(id);
}

// ─────────────────────────────────────────────────────────────────────────────
// Node Constructors
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRouteNodeOptions {
  path: string;
  filePath: string;
  line: number;
  column?: number;
  /**
   * Optional explicit route ID from the router (e.g., React Router route.id).
   * When provided, this becomes the RouteId directly (prefixed with "routeId:").
   * When omitted, RouteId is derived from path as "route:{path}".
   */
  routeId?: string;
}

/**
 * Create a RouteNode with properly typed ID.
 * @param options - Route node options
 * @returns Typed RouteNode
 * @throws ZodError if path is invalid
 */
export function createRouteNode(options: CreateRouteNodeOptions): RouteNode {
  const { path, filePath, line, column, routeId } = options;

  // Use explicit routeId if provided, otherwise derive from path
  const id = routeId
    ? RouteIdSchema.parse(`routeId:${routeId}`)
    : createRouteId(path);

  return {
    kind: 'route' as const,
    id,
    path,
    source: {
      filePath,
      line,
      ...(column !== undefined && { column }),
    },
  };
}

export interface CreateComponentTypeNodeOptions {
  id: string;
  displayName: string;
  filePath: string;
  line: number;
  column?: number;
}

/**
 * Create a ComponentTypeNode with properly typed ID.
 * @param options - Component type node options
 * @returns Typed ComponentTypeNode
 * @throws ZodError if id is invalid
 */
export function createComponentTypeNode(
  options: CreateComponentTypeNodeOptions
): ComponentTypeNode {
  const { id, displayName, filePath, line, column } = options;
  return {
    kind: 'componentType' as const,
    id: createComponentTypeId(id),
    displayName,
    source: {
      filePath,
      line,
      ...(column !== undefined && { column }),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Edge Constructors
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateRouteUsesComponentTypeEdgeOptions {
  routePath: string;
  componentTypeId: string;
}

/**
 * Create a RouteUsesComponentTypeEdge with properly typed IDs.
 * @param options - Edge options
 * @returns Typed RouteUsesComponentTypeEdge
 * @throws ZodError if IDs are invalid
 */
export function createRouteUsesComponentTypeEdge(
  options: CreateRouteUsesComponentTypeEdgeOptions
): RouteUsesComponentTypeEdge {
  const { routePath, componentTypeId } = options;
  return {
    kind: 'routeUsesComponentType' as const,
    routeId: createRouteId(routePath),
    componentTypeId: createComponentTypeId(componentTypeId),
  };
}

export interface CreateComponentTypeUsesComponentTypeEdgeOptions {
  from: string;
  to: string;
}

/**
 * Create a ComponentTypeUsesComponentTypeEdge with properly typed IDs.
 * @param options - Edge options
 * @returns Typed ComponentTypeUsesComponentTypeEdge
 * @throws ZodError if IDs are invalid
 */
export function createComponentTypeUsesComponentTypeEdge(
  options: CreateComponentTypeUsesComponentTypeEdgeOptions
): ComponentTypeUsesComponentTypeEdge {
  const { from, to } = options;
  return {
    kind: 'componentTypeUsesComponentType' as const,
    from: createComponentTypeId(from),
    to: createComponentTypeId(to),
  };
}
