// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Runtime Shim
// ─────────────────────────────────────────────────────────────────────────────
// This file provides production-safe exports for Scaffa runtime components.
// 
// In PRODUCTION: These are no-op passthroughs (no Scaffa functionality)
// In SCAFFA PREVIEW: The harness provides a real ScaffaProvider, and these 
//   components will connect to it via React context.
//
// ARCHITECTURE:
// This is a bridge for the transition to pure Harness Model. Eventually,
// Scaffa will inject instrumentation at dev-time via Vite transforms,
// and components won't need to import from here at all.

import React, { type ReactNode, createContext, useContext } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Instance Context (for override application)
// ─────────────────────────────────────────────────────────────────────────────
interface InstanceContextValue {
  instanceId: string | null;
  typeId: string | null;
}

const InstanceContext = createContext<InstanceContextValue>({
  instanceId: null,
  typeId: null,
});

// ─────────────────────────────────────────────────────────────────────────────
// ScaffaInstance - Boundary component for selectable instances
// ─────────────────────────────────────────────────────────────────────────────
// In production: just renders children (passthrough)
// In Scaffa preview: connects to ScaffaProvider for selection/overrides
interface ScaffaInstanceProps {
  children: ReactNode;
  typeId: string;
  displayName?: string;
}

export function ScaffaInstance({ children, typeId, displayName }: ScaffaInstanceProps) {
  // For now, just render children with context
  // The real ScaffaProvider (from harness) will make this functional
  const instanceId = React.useId();

  return (
    <InstanceContext.Provider value={{ instanceId, typeId }}>
      {children}
    </InstanceContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// useScaffaInstance - Hook to apply overrides to props
// ─────────────────────────────────────────────────────────────────────────────
// In production: returns props unchanged (passthrough)
// In Scaffa preview: merges overrides from ScaffaProvider
export function useScaffaInstance<T extends object>(props: T): T {
  // For now, just return props unchanged
  // The real implementation would check for overrides from ScaffaProvider context
  return props;
}
