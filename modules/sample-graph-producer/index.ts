// ─────────────────────────────────────────────────────────────────────────────
// Sample Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Demonstrates graph producer API by emitting sample routes and component types.

import type {
  ExtensionContext,
  GraphProducer,
  Disposable,
  GraphPatch,
  GraphSnapshot,
} from '../../extension-sdk.js';
import {
  createRouteNode,
  createComponentTypeNode,
  createRouteUsesComponentTypeEdge,
  createComponentTypeUsesComponentTypeEdge,
} from '../../extension-sdk.js';

export function activate(context: ExtensionContext): void {
  console.log('[SampleGraphProducer] Activating...');

  const producer: GraphProducer = {
    id: 'sample-graph-producer',

    async initialize(): Promise<GraphSnapshot> {
      console.log('[SampleGraphProducer] Initializing with sample data...');

      // Return initial graph snapshot with sample routes and component types
      return {
        schemaVersion: 'v0' as const,
        revision: 1,
        nodes: [
          createRouteNode({
            path: '/',
            filePath: 'src/app/page.tsx',
            line: 1,
          }),
          createRouteNode({
            path: '/about',
            filePath: 'src/app/about/page.tsx',
            line: 1,
          }),
          createComponentTypeNode({
            id: 'ui.button',
            displayName: 'Button',
            filePath: 'src/components/Button.tsx',
            line: 5,
          }),
          createComponentTypeNode({
            id: 'ui.card',
            displayName: 'Card',
            filePath: 'src/components/Card.tsx',
            line: 3,
          }),
          createComponentTypeNode({
            id: 'layout.header',
            displayName: 'Header',
            filePath: 'src/components/Header.tsx',
            line: 1,
          }),
        ],
        edges: [
          createRouteUsesComponentTypeEdge({
            routePath: '/',
            componentTypeId: 'ui.button',
          }),
          createRouteUsesComponentTypeEdge({
            routePath: '/',
            componentTypeId: 'ui.card',
          }),
          createRouteUsesComponentTypeEdge({
            routePath: '/about',
            componentTypeId: 'layout.header',
          }),
          createComponentTypeUsesComponentTypeEdge({
            from: 'layout.header',
            to: 'ui.button',
          }),
        ],
      };
    },

    start(onPatch: (patch: GraphPatch) => void): Disposable {
      console.log('[SampleGraphProducer] Starting patch emission...');

      // Emit a sample patch after 2 seconds to demonstrate live updates
      const timeout = setTimeout(() => {
        console.log('[SampleGraphProducer] Emitting sample patch...');
        onPatch({
          schemaVersion: 'v0' as const,
          revision: 2,
          ops: [
            {
              op: 'upsertNode' as const,
              node: createRouteNode({
                path: '/contact',
                filePath: 'src/app/contact/page.tsx',
                line: 1,
              }),
            },
            {
              op: 'upsertEdge' as const,
              edge: createRouteUsesComponentTypeEdge({
                routePath: '/contact',
                componentTypeId: 'ui.button',
              }),
            },
          ],
        });
      }, 2000);

      return {
        dispose: () => {
          clearTimeout(timeout);
          console.log('[SampleGraphProducer] Stopped');
        },
      };
    },
  };

  context.graph.registerProducer(producer);
  console.log('[SampleGraphProducer] Activated');
}

export function deactivate(): void {
  console.log('[SampleGraphProducer] Deactivated');
}
