// ─────────────────────────────────────────────────────────────────────────────
// React Router Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Statically parses React Router data-router route definitions and emits
// route nodes/edges to the Project Graph.

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as ts from 'typescript';
import { createRouteNode, createRouteUsesComponentTypeEdge } from '../../../extension-sdk.js';

export function activate(context) {
  console.log('[ReactRouterGraphProducer] Activating...');

  // Get the workspace root from context
  const workspaceRoot = context.workspaceRoot;
  if (!workspaceRoot) {
    console.error('[ReactRouterGraphProducer] No workspace root available');
    return;
  }

  // For v0, we'll hardcode the demo route module path
  // TODO: Read from config once we add routeModule config option
  const routeModulePath = path.join(workspaceRoot, 'app/src/routes.tsx');

  const producer = {
    id: 'react-router-graph-producer',

    async initialize() {
      console.log('[ReactRouterGraphProducer] Parsing route module:', routeModulePath);

      try {
        const routes = await parseRouteModule(routeModulePath);
        const { nodes, edges } = buildGraphFromRoutes(routes, routeModulePath);

        return {
          schemaVersion: 'v0',
          revision: 1,
          nodes,
          edges,
        };
      } catch (error) {
        console.error('[ReactRouterGraphProducer] Failed to parse routes:', error);
        // Return empty graph on error with diagnostic
        return {
          schemaVersion: 'v0',
          revision: 1,
          nodes: [],
          edges: [],
        };
      }
    },

    start(onPatch) {
      console.log('[ReactRouterGraphProducer] Starting file watch for:', routeModulePath);

      let revision = 1;

      // Watch the route module for changes
      const watcher = fs.watch(routeModulePath, async (eventType) => {
        if (eventType === 'change') {
          console.log('[ReactRouterGraphProducer] Route module changed, emitting patch...');

          try {
            revision++;
            const routes = await parseRouteModule(routeModulePath);
            const { nodes, edges } = buildGraphFromRoutes(routes, routeModulePath);

            // Emit a patch that replaces all route nodes/edges
            const ops = [
              // First, we would need to remove old nodes, but for v0 we can
              // just upsert all nodes (they'll replace based on ID)
              ...nodes.map((node) => ({ op: 'upsertNode', node })),
              ...edges.map((edge) => ({ op: 'upsertEdge', edge })),
            ];

            onPatch({
              schemaVersion: 'v0',
              revision,
              ops,
            });
          } catch (error) {
            console.error('[ReactRouterGraphProducer] Failed to parse routes on change:', error);
          }
        }
      });

      return {
        dispose: () => {
          watcher.close();
          console.log('[ReactRouterGraphProducer] Stopped file watch');
        },
      };
    },
  };

  context.graph.registerProducer(producer);
  console.log('[ReactRouterGraphProducer] Activated');
}

export function deactivate() {
  console.log('[ReactRouterGraphProducer] Deactivated');
}

/**
 * Parse a TypeScript route module file and extract route definitions.
 * Uses TypeScript compiler API to parse the AST.
 */
async function parseRouteModule(filePath) {
  const sourceText = await fs.promises.readFile(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true
  );

  const routes = [];

  // Find the exported 'routes' variable
  function visit(node) {
    if (ts.isVariableStatement(node)) {
      const declaration = node.declarationList.declarations[0];
      if (
        declaration &&
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === 'routes' &&
        declaration.initializer &&
        ts.isArrayLiteralExpression(declaration.initializer)
      ) {
        // Parse each route object
        for (const element of declaration.initializer.elements) {
          if (ts.isObjectLiteralExpression(element)) {
            const route = parseRouteObject(element);
            if (route) {
              routes.push(route);
            }
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  if (routes.length === 0) {
    throw new Error(`No routes found in ${filePath}. Expected export: const routes: RouteObject[] = [...]`);
  }

  return routes;
}

/**
 * Parse a single route object literal from the AST
 */
function parseRouteObject(node) {
  let id;
  let path;
  const children = [];

  for (const prop of node.properties) {
    if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
      const propName = prop.name.text;

      if (propName === 'id' && ts.isStringLiteral(prop.initializer)) {
        id = prop.initializer.text;
      } else if (propName === 'path' && ts.isStringLiteral(prop.initializer)) {
        path = prop.initializer.text;
      } else if (propName === 'children' && ts.isArrayLiteralExpression(prop.initializer)) {
        // Recursively parse children
        for (const child of prop.initializer.elements) {
          if (ts.isObjectLiteralExpression(child)) {
            const childRoute = parseRouteObject(child);
            if (childRoute) {
              children.push(childRoute);
            }
          }
        }
      }
    }
  }

  // Require both id and path for v0 (allow empty string for index routes)
  if (!id || path === undefined) {
    console.warn(
      '[ReactRouterGraphProducer] Route missing required id or path:',
      { id, path }
    );
    return null;
  }

  return { id, path, children: children.length > 0 ? children : undefined };
}

/**
 * Build graph nodes and edges from parsed route definitions
 */
function buildGraphFromRoutes(routes, sourceFilePath) {
  const nodes = [];
  const edges = [];

  function processRoute(route, parentId) {
    // Create route node with explicit router id for stable joins
    nodes.push(
      createRouteNode({
        path: route.path,
        routeId: route.id,
        filePath: sourceFilePath,
        line: 1, // TODO: Track actual line numbers from AST
      })
    );

    // If this route has a parent, create parent-child edge (not in v0 schema yet)
    // For now, we can just track component type relationships

    // Process children recursively
    if (route.children) {
      for (const child of route.children) {
        processRoute(child, route.id);
      }
    }
  }

  for (const route of routes) {
    processRoute(route);
  }

  return { nodes, edges };
}
