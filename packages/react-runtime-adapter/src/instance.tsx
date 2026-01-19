// ─────────────────────────────────────────────────────────────────────────────
// Scaffa Instance Boundary (v0)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useId } from 'react';
import { useScaffaContext } from './provider.js';
import { applyOverride } from './overrides.js';

/**
 * Higher-order component for registry-driven instrumentation.
 * Wraps a component export to inject componentTypeId for selection/editing.
 *
 * This is used by the vite-launcher's instrumentation plugin to wrap
 * component exports that match registry implementation hints.
 *
 * The adapter owns instanceId generation; this HOC provides the typeId
 * and applies overrides directly without requiring app code to use useScaffaInstance.
 * See: docs/scaffa_harness_model.md (5.6), docs/scaffa_runtime_adapter_integration_guide.md (2.2.2)
 *
 * @param WrappedComponent - The original component to wrap
 * @param componentTypeId - The registry type ID for this component
 * @returns A wrapped component with instrumentation and override application
 */
export function ScaffaInstanceBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentTypeId: string
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const BoundaryComponent: React.FC<P> = (props) => {
    const { adapter, overrideVersion } = useScaffaContext();
    const reactId = useId();
    const instanceId = `inst_${reactId.replace(/:/g, '_')}`;

    useEffect(() => {
      // Register instance with adapter
      adapter.registerInstance({
        instanceId,
        componentTypeId,
        displayName,
      });

      return () => {
        // Unregister on unmount
        adapter.unregisterInstance(instanceId);
      };
    }, [adapter, instanceId]);

    // Apply overrides to props
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
    }, [adapter, instanceId, props, overrideVersion]);

    return (
      <div data-scaffa-instance-id={instanceId} data-scaffa-type-id={componentTypeId}>
        <WrappedComponent {...effectiveProps} />
      </div>
    );
  };

  BoundaryComponent.displayName = `ScaffaInstanceBoundary(${displayName})`;

  return BoundaryComponent;
}
