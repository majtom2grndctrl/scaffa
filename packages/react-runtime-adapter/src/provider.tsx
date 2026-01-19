// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Provider (v0)
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ScaffaReactAdapter } from './adapter.js';
import type { ScaffaAdapterConfig, InstanceIdentity } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Context
// ─────────────────────────────────────────────────────────────────────────────

interface ScaffaContextValue {
  adapter: ScaffaReactAdapter;
  selectedInstance: InstanceIdentity | null;
  overrideVersion: number;
}

const ScaffaContext = createContext<ScaffaContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Provider
// ─────────────────────────────────────────────────────────────────────────────

export interface ScaffaProviderProps {
  config: ScaffaAdapterConfig;
  children: React.ReactNode;
}

export function ScaffaProvider({ config, children }: ScaffaProviderProps) {
  const [adapter] = useState(() => new ScaffaReactAdapter(config));
  const [selectedInstance, setSelectedInstance] = useState<InstanceIdentity | null>(null);
  const [overrideVersion, setOverrideVersion] = useState(0);

  useEffect(() => {
    // Initialize adapter
    void adapter.init();

    // Subscribe to selection changes
    const unsubscribeSelection = adapter.onSelectionChange((identity) => {
      setSelectedInstance(identity);
    });

    // Subscribe to override changes
    const unsubscribeOverrides = adapter.onOverrideChange(() => {
      setOverrideVersion((v) => v + 1);
    });

    return () => {
      unsubscribeSelection();
      unsubscribeOverrides();
    };
  }, [adapter]);

  const value: ScaffaContextValue = {
    adapter,
    selectedInstance,
    overrideVersion,
  };

  return <ScaffaContext.Provider value={value}>{children}</ScaffaContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the Scaffa adapter context.
 * @internal
 */
export function useScaffaContext(): ScaffaContextValue {
  const context = useContext(ScaffaContext);
  if (!context) {
    throw new Error('useScaffaContext must be used within ScaffaProvider');
  }
  return context;
}
