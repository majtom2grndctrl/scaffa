/**
 * Scaffa Runtime Shim (Development Mode)
 *
 * Re-exports the real @scaffa/react-runtime-adapter for Scaffa-enabled dev builds.
 * This file is aliased via Vite config when mode === 'development'.
 */

export {
  ScaffaProvider,
  ScaffaInstance,
  useScaffaInstance,
} from '@scaffa/react-runtime-adapter';
