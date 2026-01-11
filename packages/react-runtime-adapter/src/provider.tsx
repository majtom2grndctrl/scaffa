// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Provider (v0)
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useState } from 'react';
import { ScaffaReactAdapter } from './adapter.js';
import type { ScaffaAdapterConfig, InstanceIdentity } from './types.js';
import { useInstanceId } from './instance.js';

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
 */
export function useScaffaContext(): ScaffaContextValue {
  const context = useContext(ScaffaContext);
  if (!context) {
    throw new Error('useScaffaContext must be used within ScaffaProvider');
  }
  return context;
}

/**
 * Hook for instance components to get their effective props with overrides.
 * Must be used within a ScaffaInstance component.
 */
export function useScaffaInstance<T extends Record<string, unknown>>(props: T): T {
  const { adapter, overrideVersion } = useScaffaContext();

  // Get instance ID from instance context (provided by ScaffaInstance)
  const instanceId = useInstanceId();

  if (!instanceId) {
    throw new Error('useScaffaInstance must be used within ScaffaInstance');
  }

  // Recompute when overrides change
  const effectiveProps = React.useMemo(() => {
    const overrides = adapter.getOverrides(instanceId);
    if (overrides.size === 0) {
      return props;
    }

    // Apply overrides to props
    const result = { ...props };
    for (const [path, value] of overrides) {
      applyOverride(result, path, value);
    }
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, props, overrideVersion]);

  return effectiveProps;
}

/**
 * Apply an override at a JSON Pointer path.
 */
function applyOverride(obj: any, path: string, value: unknown): void {
  // JSON Pointer format: "/prop" or "/nested/0/field"
  if (!path.startsWith('/')) {
    console.warn('[ScaffaProvider] Invalid prop path:', path);
    return;
  }

  const parts = path.slice(1).split('/');
  if (parts.length === 0) {
    return;
  }

  // Navigate to parent
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      // Create intermediate object/array if needed
      const nextPart = parts[i + 1];
      current[part] = /^\d+$/.test(nextPart) ? [] : {};
    }
    current = current[part];
  }

  // Set value
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}
