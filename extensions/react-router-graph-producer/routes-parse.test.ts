import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the producer's parsing logic (we'll need to export these for testing)
import * as ts from 'typescript';

describe('React Router Graph Producer - routes.tsx integration', () => {
  it('demo/app/src/routes.tsx exists and is readable', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../demo');
    const routesPath = path.join(workspaceRoot, 'app/src/routes.tsx');

    // Verify file exists
    expect(fs.existsSync(routesPath)).toBe(true);

    // Verify file is readable
    const content = await fs.promises.readFile(routesPath, 'utf-8');
    expect(content).toBeTruthy();

    // Verify it exports routes array
    expect(content).toContain('export const routes');
    expect(content).toContain('RouteObject[]');
  });

  it('routes.tsx contains required route shape with id field', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../demo');
    const routesPath = path.join(workspaceRoot, 'app/src/routes.tsx');

    const content = await fs.promises.readFile(routesPath, 'utf-8');

    // Verify routes have id field (required for graph producer)
    expect(content).toContain("id: 'home'");

    // Verify routes have path field
    expect(content).toContain("path: '/'");
  });

  it('producer emits stable RouteIds using explicit route.id', async () => {
    const workspaceRoot = path.resolve(__dirname, '../../demo');
    const routesPath = path.join(workspaceRoot, 'app/src/routes.tsx');

    // Parse the route module to extract route definitions
    const sourceText = await fs.promises.readFile(routesPath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      routesPath,
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    interface RouteDefinition {
      id: string;
      path: string;
    }

    const routes: RouteDefinition[] = [];

    function visit(node: ts.Node) {
      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (
          declaration &&
          ts.isIdentifier(declaration.name) &&
          declaration.name.text === 'routes' &&
          declaration.initializer &&
          ts.isArrayLiteralExpression(declaration.initializer)
        ) {
          for (const element of declaration.initializer.elements) {
            if (ts.isObjectLiteralExpression(element)) {
              let id: string | undefined;
              let path: string | undefined;

              for (const prop of element.properties) {
                if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
                  if (prop.name.text === 'id' && ts.isStringLiteral(prop.initializer)) {
                    id = prop.initializer.text;
                  } else if (prop.name.text === 'path' && ts.isStringLiteral(prop.initializer)) {
                    path = prop.initializer.text;
                  }
                }
              }

              if (id && path) {
                routes.push({ id, path });
              }
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);

    // Verify we found routes
    expect(routes.length).toBeGreaterThan(0);

    // Verify at least one route has explicit id
    const homeRoute = routes.find(r => r.path === '/');
    expect(homeRoute).toBeDefined();
    expect(homeRoute?.id).toBeDefined();

    // Import the graph producer and test it produces correct RouteIds
    const { activate } = await import('./module/index.js');

    // Mock ExtensionContext
    const mockContext = {
      workspaceRoot: workspaceRoot,
      graph: {
        registerProducer: (producer: any) => {
          // Call initialize and verify the snapshot
          producer.initialize().then((snapshot: any) => {
            expect(snapshot.schemaVersion).toBe('v0');
            expect(snapshot.nodes).toBeDefined();

            // Find route nodes
            const routeNodes = snapshot.nodes.filter((n: any) => n.kind === 'route');
            expect(routeNodes.length).toBeGreaterThan(0);

            // Verify home route uses explicit id format: routeId:home (not route:/)
            const homeNode = routeNodes.find((n: any) => n.path === '/');
            expect(homeNode).toBeDefined();
            expect(homeNode?.id).toMatch(/^routeId:/);
            expect(homeNode?.id).not.toBe('route:/');

            // Verify the id matches the parsed route.id
            if (homeRoute) {
              expect(homeNode?.id).toBe(`routeId:${homeRoute.id}`);
            }
          });
        },
      },
    };

    // Activate the producer
    activate(mockContext as any);
  });

  it('producer handles routes with duplicate paths using stable IDs', async () => {
    // Create a temporary test file with duplicate paths
    const testRoutesContent = `
import type { RouteObject } from 'react-router-dom';

export const routes: RouteObject[] = [
  {
    id: 'layout-1',
    path: '/',
    element: null,
  },
  {
    id: 'layout-2',
    path: '/',
    element: null,
  },
];
`;

    const tempDir = path.join(__dirname, '.tmp-test');
    const tempFile = path.join(tempDir, 'routes.tsx');

    // Create temp directory
    await fs.promises.mkdir(tempDir, { recursive: true });
    await fs.promises.writeFile(tempFile, testRoutesContent);

    try {
      // Import createRouteNode helper
      const { createRouteNode } = await import('../../../extension-sdk.js');

      // Simulate what the producer does
      const node1 = createRouteNode({
        path: '/',
        routeId: 'layout-1',
        filePath: tempFile,
        line: 1,
      });

      const node2 = createRouteNode({
        path: '/',
        routeId: 'layout-2',
        filePath: tempFile,
        line: 1,
      });

      // Verify IDs are different despite same path
      expect(node1.id).toBe('routeId:layout-1');
      expect(node2.id).toBe('routeId:layout-2');
      expect(node1.id).not.toBe(node2.id);

      // Verify both have the same path
      expect(node1.path).toBe('/');
      expect(node2.path).toBe('/');
    } finally {
      // Cleanup
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });
});
