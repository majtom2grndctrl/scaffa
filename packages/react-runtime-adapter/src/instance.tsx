// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Instance Component (v0)
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useEffect, useId } from 'react';
import { useScaffaContext } from './provider.js';
import type { ScaffaInstanceProps } from './types.js';

// Context to provide instance ID to children
const InstanceIdContext = createContext<string | null>(null);

/**
 * Get the current instance ID from context.
 * @internal
 */
export function useInstanceId(): string | null {
  return useContext(InstanceIdContext);
}

/**
 * Wrapper component that marks a React element as a Scaffa instance.
 * Provides instance identity for click-to-select and override application.
 */
export function ScaffaInstance({
  typeId,
  displayName,
  children,
}: ScaffaInstanceProps): React.ReactElement {
  const { adapter } = useScaffaContext();
  const reactId = useId();
  const instanceId = `inst_${reactId.replace(/:/g, '_')}`;

  useEffect(() => {
    // Register instance with adapter
    adapter.registerInstance({
      instanceId,
      componentTypeId: typeId,
      displayName,
    });

    return () => {
      // Unregister on unmount
      adapter.unregisterInstance(instanceId);
    };
  }, [adapter, instanceId, typeId, displayName]);

  return (
    <InstanceIdContext.Provider value={instanceId}>
      <div data-scaffa-instance-id={instanceId} data-scaffa-type-id={typeId}>
        {children}
      </div>
    </InstanceIdContext.Provider>
  );
}
