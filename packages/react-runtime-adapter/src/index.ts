// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Runtime Adapter (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Framework adapter for React preview runtimes.
//
// PUBLIC API (for harness/launcher):
// - ScaffaReactAdapter: Runtime adapter class
// - ScaffaProvider: React context provider for adapter
// - ScaffaInstanceBoundary: HOC for registry-driven instrumentation
// - useScaffaRouterState: Hook for router state tracking
//
// REMOVED (v0 Harness Model):
// - ScaffaInstance: No longer needed (instrumentation is automatic)
// - useScaffaInstance: No longer needed (overrides applied by ScaffaInstanceBoundary)

export { ScaffaReactAdapter } from './adapter.js';
export { ScaffaProvider } from './provider.js';
export { ScaffaInstanceBoundary } from './instance.js';
export { useScaffaRouterState } from './router.js';
export type {
  ScaffaAdapterConfig,
  InstanceIdentity,
} from './types.js';
