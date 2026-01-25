// ─────────────────────────────────────────────────────────────────────────────
// Sample Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Demonstrates graph producer API by emitting sample routes and component types.

import {
  createRouteNode,
  createComponentTypeNode,
  createRouteUsesComponentTypeEdge,
  createComponentTypeUsesComponentTypeEdge,
} from '../../../extension-sdk.js';

export function activate(context) {
  console.log('[SampleGraphProducer] Activating...');

  const producer = {
    id: 'sample-graph-producer',

    async initialize() {
      console.log('[SampleGraphProducer] Initializing with sample data...');

      // Return initial graph snapshot with sample routes and component types
      return {
        schemaVersion: 'v0',
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

    start(onPatch) {
      console.log('[SampleGraphProducer] Starting patch emission...');

      // Emit a sample patch after 2 seconds to demonstrate live updates
      const timeout = setTimeout(() => {
        console.log('[SampleGraphProducer] Emitting sample patch...');
        onPatch({
          schemaVersion: 'v0',
          revision: 2,
          ops: [
            {
              op: 'upsertNode',
              node: createRouteNode({
                path: '/contact',
                filePath: 'src/app/contact/page.tsx',
                line: 1,
              }),
            },
            {
              op: 'upsertEdge',
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

export function deactivate() {
  console.log('[SampleGraphProducer] Deactivated');
}
