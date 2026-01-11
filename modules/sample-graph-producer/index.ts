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
          {
            kind: 'route' as const,
            id: 'route:/' as any,
            path: '/',
            source: {
              filePath: 'src/app/page.tsx',
              line: 1,
            },
          },
          {
            kind: 'route' as const,
            id: 'route:/about' as any,
            path: '/about',
            source: {
              filePath: 'src/app/about/page.tsx',
              line: 1,
            },
          },
          {
            kind: 'componentType' as const,
            id: 'ui.button' as any,
            displayName: 'Button',
            source: {
              filePath: 'src/components/Button.tsx',
              line: 5,
            },
          },
          {
            kind: 'componentType' as const,
            id: 'ui.card' as any,
            displayName: 'Card',
            source: {
              filePath: 'src/components/Card.tsx',
              line: 3,
            },
          },
          {
            kind: 'componentType' as const,
            id: 'layout.header' as any,
            displayName: 'Header',
            source: {
              filePath: 'src/components/Header.tsx',
              line: 1,
            },
          },
        ],
        edges: [
          {
            kind: 'routeUsesComponentType' as const,
            routeId: 'route:/' as any,
            componentTypeId: 'ui.button' as any,
          },
          {
            kind: 'routeUsesComponentType' as const,
            routeId: 'route:/' as any,
            componentTypeId: 'ui.card' as any,
          },
          {
            kind: 'routeUsesComponentType' as const,
            routeId: 'route:/about' as any,
            componentTypeId: 'layout.header' as any,
          },
          {
            kind: 'componentTypeUsesComponentType' as const,
            from: 'layout.header' as any,
            to: 'ui.button' as any,
          },
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
              node: {
                kind: 'route' as const,
                id: 'route:/contact' as any,
                path: '/contact',
                source: {
                  filePath: 'src/app/contact/page.tsx',
                  line: 1,
                },
              },
            },
            {
              op: 'upsertEdge' as const,
              edge: {
                kind: 'routeUsesComponentType' as const,
                routeId: 'route:/contact' as any,
                componentTypeId: 'ui.button' as any,
              },
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
