/**
 * Scaffa Runtime Shim (Production Mode)
 *
 * Provides no-op implementations for production builds.
 * This ensures the app runs normally without requiring @scaffa/* packages.
 * This file is aliased via Vite config when mode === 'production'.
 */

import type { ReactNode } from 'react';

/**
 * No-op ScaffaProvider - just renders children without Scaffa instrumentation
 */
export function ScaffaProvider({ children }: { children: ReactNode; config?: unknown }) {
  return children;
}

/**
 * No-op ScaffaInstance - just renders children without instance tracking
 */
export function ScaffaInstance({
  children,
}: {
  children: ReactNode;
  typeId?: string;
  displayName?: string;
}) {
  return children;
}

/**
 * No-op useScaffaInstance - returns props as-is without applying overrides
 */
export function useScaffaInstance<T>(props: T): T {
  return props;
}
