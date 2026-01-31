// ─────────────────────────────────────────────────────────────────────────────
// Skaffa React Runtime Adapter (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Framework adapter for React preview runtimes.
//
// PUBLIC API (for harness/launcher):
// - SkaffaReactAdapter: Runtime adapter class
// - SkaffaProvider: React context provider for adapter
// - SkaffaInstanceBoundary: HOC for registry-driven instrumentation
// - useSkaffaRouterState: Hook for router state tracking
//
// REMOVED (v0 Harness Model):
// - SkaffaInstance: No longer needed (instrumentation is automatic)
// - useSkaffaInstance: No longer needed (overrides applied by SkaffaInstanceBoundary)

export { SkaffaReactAdapter } from './adapter.js';
export { SkaffaProvider } from './provider.js';
export { SkaffaInstanceBoundary } from './instance.js';
export { useSkaffaRouterState } from './router.js';
export type {
  SkaffaAdapterConfig,
  InstanceIdentity,
} from './types.js';
