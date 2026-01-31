// ─────────────────────────────────────────────────────────────────────────────
// Skaffa React Provider (v0)
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import { SkaffaReactAdapter } from './adapter.js';
import type { SkaffaAdapterConfig, InstanceIdentity } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Skaffa Context
// ─────────────────────────────────────────────────────────────────────────────

interface SkaffaContextValue {
  adapter: SkaffaReactAdapter;
  selectedInstance: InstanceIdentity | null;
  overrideVersion: number;
}

const SkaffaContext = createContext<SkaffaContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// Skaffa Provider
// ─────────────────────────────────────────────────────────────────────────────

export interface SkaffaProviderProps {
  config: SkaffaAdapterConfig;
  children: React.ReactNode;
}

export function SkaffaProvider({ config, children }: SkaffaProviderProps) {
  const [adapter] = useState(() => new SkaffaReactAdapter(config));
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

  const value: SkaffaContextValue = {
    adapter,
    selectedInstance,
    overrideVersion,
  };

  return <SkaffaContext.Provider value={value}>{children}</SkaffaContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the Skaffa adapter context.
 * @internal
 */
export function useSkaffaContext(): SkaffaContextValue {
  const context = useContext(SkaffaContext);
  if (!context) {
    throw new Error('useSkaffaContext must be used within SkaffaProvider');
  }
  return context;
}
