// ─────────────────────────────────────────────────────────────────────────────
// Demo Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Provides graph snapshot with routes and component types for the demo workspace.

import type {
  ExtensionContext,
  GraphProducer,
  Disposable,
} from '../../../src/extension-host/extension-context.js';
import type { GraphPatch, GraphSnapshot } from '../../../src/shared/project-graph.js';

export function activate(context: ExtensionContext): void {
  console.log('[DemoGraphProducer] Activating...');

  const producer: GraphProducer = {
    id: 'demo-graph-producer',

    async initialize(): Promise<GraphSnapshot> {
      console.log('[DemoGraphProducer] Initializing with demo workspace data...');

      // Return initial graph snapshot with demo routes and component types
      return {
        schemaVersion: 'v0' as const,
        revision: 1,
        nodes: [
          // Routes
          {
            kind: 'route' as const,
            id: 'route:/' as any,
            path: '/',
            source: {
              filePath: 'demo/app/src/App.tsx',
              line: 5,
            },
          },
          // Component types used in demo app
          {
            kind: 'componentType' as const,
            id: 'demo.button' as any,
            displayName: 'Demo Button',
            source: {
              filePath: 'demo/app/src/components/DemoButton.tsx',
              line: 56,
            },
          },
          {
            kind: 'componentType' as const,
            id: 'demo.card' as any,
            displayName: 'Demo Card',
            source: {
              filePath: 'demo/app/src/components/DemoCard.tsx',
              line: 47,
            },
          },
        ],
        edges: [
          // App route uses demo.button
          {
            kind: 'routeUsesComponentType' as const,
            routeId: 'route:/' as any,
            componentTypeId: 'demo.button' as any,
          },
          // App route uses demo.card
          {
            kind: 'routeUsesComponentType' as const,
            routeId: 'route:/' as any,
            componentTypeId: 'demo.card' as any,
          },
        ],
      };
    },

    start(onPatch: (patch: GraphPatch) => void): Disposable {
      console.log('[DemoGraphProducer] Starting patch emission...');

      // For demo purposes, we can emit patches later if needed
      // For now, just provide initial snapshot

      return {
        dispose: () => {
          console.log('[DemoGraphProducer] Stopped');
        },
      };
    },
  };

  context.graph.registerProducer(producer);
  console.log('[DemoGraphProducer] Activated');
}

export function deactivate(): void {
  console.log('[DemoGraphProducer] Deactivated');
}
