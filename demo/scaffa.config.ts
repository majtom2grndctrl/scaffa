// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Demo Workspace Configuration (v0)
// ─────────────────────────────────────────────────────────────────────────────
// This workspace demonstrates the complete v0 end-to-end journey with:
// - Component registry (demo module)
// - Graph producer (sample graph producer)
// - React runtime adapter
// - Preview sessions
// - Inspector editing with overrides

import { defineScaffaConfig } from '../src/shared/config.js';

export default defineScaffaConfig({
  schemaVersion: 'v0',
  modules: [
    // Component registry provider for demo.button and demo.card
    {
      id: 'demo-module',
      path: './extensions/demo-module/index.js',
    },
    // Graph producer for routes (React Router data-router API)
    {
      id: 'react-router-graph-producer',
      path: '../extensions/react-router-graph-producer/module/index.js',
    },
    // Demo graph producer for component types (demo-only)
    {
      id: 'demo-graph-producer',
      path: './extensions/demo-graph-producer/index.js',
    },
    // Vite+React preview launcher for managed dev server
    {
      id: 'vite-launcher',
      path: './extensions/vite-launcher/index.js',
    },
  ],
  preview: {
    entry: './app/src/App.tsx',
    styles: ['./app/src/index.css'],
  },
});
