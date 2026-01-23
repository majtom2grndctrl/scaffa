// ─────────────────────────────────────────────────────────────────────────────
// Demo Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Provides graph snapshot with component types for the demo workspace.

import type {
  ExtensionContext,
  GraphProducer,
  Disposable,
  GraphPatch,
  GraphSnapshot,
} from '../../../extension-sdk.js';
import { createComponentTypeNode } from '../../../extension-sdk.js';

export function activate(context: ExtensionContext): void {
  console.log('[DemoGraphProducer] Activating...');

  const producer: GraphProducer = {
    id: 'demo-graph-producer',

    async initialize(): Promise<GraphSnapshot> {
      console.log('[DemoGraphProducer] Initializing with demo workspace data...');

      // Return initial graph snapshot with demo component types only.
      return {
        schemaVersion: 'v0' as const,
        revision: 1,
        nodes: [
          // Component types used in demo app
          createComponentTypeNode({
            id: 'demo.button',
            displayName: 'Demo Button',
            filePath: 'app/src/components/DemoButton.tsx',
            line: 56,
          }),
          createComponentTypeNode({
            id: 'demo.card',
            displayName: 'Demo Card',
            filePath: 'app/src/components/DemoCard.tsx',
            line: 47,
          }),
        ],
        edges: [],
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
