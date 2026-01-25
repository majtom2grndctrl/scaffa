// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Demo Workspace Configuration (v0)
// ─────────────────────────────────────────────────────────────────────────────
// This workspace demonstrates the complete v0 end-to-end journey with:
// - Component registry (demo module)
// - Graph producer (sample graph producer)
// - Preview sessions
// - Inspector editing with overrides

import { defineScaffaConfig } from '@scaffa/config';

export default defineScaffaConfig({
  schemaVersion: 'v0',
  modules: [
    // Component registry provider for demo.button and demo.card
    {
      id: 'demo-module',
      path: './extensions/demo-module/index.js',
    },
    // Component registry provider for shadcn/ui components
    {
      id: 'shadcn-ui-registry',
      package: '@scaffa/shadcn-ui-registry',
    },
    // Component registry provider for layout primitives
    {
      id: 'layout-registry',
      package: '@scaffa/layout-registry',
    },
    // Graph producer for routes (React Router data-router API)
    {
      id: 'react-router-graph-producer',
      package: '@scaffa/react-router-graph-producer',
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
    // Save-to-disk promoter for demo app
    {
      id: 'demo-save-adapter',
      path: './extensions/demo-save-adapter/index.js',
    },
  ],
  preview: {
    entry: './app/src/App.tsx',
    styles: ['./app/src/index.css'],
  },
});
