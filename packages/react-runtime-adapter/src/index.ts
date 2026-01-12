// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Runtime Adapter (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Framework adapter for React preview runtimes.

export { ScaffaReactAdapter } from './adapter.js';
export { ScaffaProvider, useScaffaInstance } from './provider.js';
export { ScaffaInstance, useInstanceId } from './instance.js';
export { useScaffaRouterState } from './router.js';
export type {
  ScaffaAdapterConfig,
  ScaffaInstanceProps,
  InstanceIdentity,
} from './types.js';
