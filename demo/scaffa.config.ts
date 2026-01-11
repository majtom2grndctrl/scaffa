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
      path: './extensions/demo-module/index.ts',
    },
    // Graph producer for routes and component types
    {
      id: 'demo-graph-producer',
      path: './extensions/demo-graph-producer/index.ts',
    },
  ],
});
