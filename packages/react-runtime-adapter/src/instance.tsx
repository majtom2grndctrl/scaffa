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

/**
 * Higher-order component for registry-driven instrumentation.
 * Wraps a component export to inject componentTypeId for selection/editing.
 * 
 * This is used by the vite-launcher's instrumentation plugin to wrap
 * component exports that match registry implementation hints.
 * 
 * The adapter owns instanceId generation; this HOC only provides the typeId.
 * See: docs/scaffa_harness_model.md (5.6), docs/scaffa_runtime_adapter_integration_guide.md (2.2.2)
 * 
 * @param WrappedComponent - The original component to wrap
 * @param componentTypeId - The registry type ID for this component
 * @returns A wrapped component with instrumentation
 */
export function ScaffaInstanceBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentTypeId: string
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const BoundaryComponent: React.FC<P> = (props) => {
    return (
      <ScaffaInstance typeId={componentTypeId} displayName={displayName}>
        <WrappedComponent {...props} />
      </ScaffaInstance>
    );
  };

  BoundaryComponent.displayName = `ScaffaInstanceBoundary(${displayName})`;

  return BoundaryComponent;
}
