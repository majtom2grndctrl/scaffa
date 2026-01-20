import { useMemo, useState, useEffect } from 'react';
import { useInspectorStore } from '../state/inspectorStore';
import type { PropDefinition } from '../../shared/index.js';
import type { InspectorSectionContext } from '../../shared/inspector-sections.js';
import { ControlRenderer } from './inspector/PropControls';
import { ExtensionSection } from './ExtensionSection';

export const InspectorPanel = () => {
  const selectedInstance = useInspectorStore((state) => state.selectedInstance);
  const registry = useInspectorStore((state) => state.registry);
  const overrides = useInspectorStore((state) => state.overrides);
  const isRegistryLoading = useInspectorStore((state) => state.isRegistryLoading);
  const inspectorSections = useInspectorStore((state) => state.inspectorSections);
  const isSectionsLoading = useInspectorStore((state) => state.isSectionsLoading);

  // Get the registry entry for the selected instance's component type
  const registryEntry = useMemo(() => {
    if (!selectedInstance || !registry) return null;
    return registry.components[selectedInstance.componentTypeId] ?? null;
  }, [selectedInstance, registry]);

  // Log actionable warning when registry entry is missing
  useEffect(() => {
    // Only log if we have a selected instance, registry is loaded, and entry is missing
    if (!selectedInstance || isRegistryLoading || registryEntry !== null) {
      return;
    }

    // Registry entry is missing - log actionable warning
    console.warn(
      `[Inspector] Missing registry entry for component type: ${selectedInstance.componentTypeId}`
    );
    console.warn('[Inspector] → Debugging hints:');
    console.warn(`[Inspector]   • ComponentTypeId: ${selectedInstance.componentTypeId}`);
    console.warn(
      `[Inspector]   • Instance ID: ${selectedInstance.instanceId}`
    );
    console.warn(`[Inspector]   • Session ID: ${selectedInstance.sessionId}`);
    console.warn(
      `[Inspector]   • Available registry keys: ${Object.keys(registry?.components ?? {}).join(', ') || '(none)'}`
    );
    console.warn('[Inspector] → Possible causes:');
    console.warn(
      '[Inspector]   • Runtime wrapper typeId does not match registry key'
    );
    console.warn(
      '[Inspector]   • Module failed to contribute registry (check config health banner)'
    );
    console.warn('[Inspector]   • Component is not wrapped with ScaffaInstance');
    console.warn('[Inspector] → To fix:');
    console.warn('[Inspector]   • Ensure ComponentTypeId matches across:');
    console.warn('[Inspector]     1. Registry entry key (e.g., components["ui.button"])');
    console.warn('[Inspector]     2. Graph node id (componentType node)');
    console.warn(
      '[Inspector]     3. Runtime wrapper <ScaffaInstance typeId="ui.button" />'
    );
  }, [selectedInstance, registry, registryEntry, isRegistryLoading]);

  // Count overrides for the selected instance
  const instanceOverrideCount = useMemo(() => {
    if (!selectedInstance) return 0;
    return overrides.filter(
      (override) => override.instanceId === selectedInstance.instanceId
    ).length;
  }, [selectedInstance, overrides]);

  // Group and sort props by group and order
  const propGroups = useMemo(() => {
    if (!registryEntry) return new Map<string | undefined, PropDefinition[]>();

    const groups = new Map<string | undefined, PropDefinition[]>();

    // Collect all props and group them
    Object.values(registryEntry.props).forEach((propDef) => {
      const groupKey = propDef.group;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(propDef);
    });

    // Sort props within each group by order (ascending, undefined last)
    groups.forEach((props) => {
      props.sort((a, b) => {
        const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
        return orderA - orderB;
      });
    });

    return groups;
  }, [registryEntry]);

  // Detect orphaned overrides (overrides that don't match the current instance)
  const orphanedOverrides = useMemo(() => {
    if (!selectedInstance) return [];
    return overrides.filter(
      (override) => override.instanceId !== selectedInstance.instanceId
    );
  }, [selectedInstance, overrides]);

  // No selection state
  if (!selectedInstance) {
    return (
      <div className="p-4">
        <h2 className="mb-3 text-sm font-semibold text-fg">Inspector</h2>
        <div className="mt-4">
          <p className="text-xs text-fg-subtle">No instance selected</p>
          <p className="mt-2 text-xs text-fg-subtle">
            Click a component in the preview to inspect and edit its properties.
          </p>
        </div>
      </div>
    );
  }

  // Handle clearing orphaned overrides
  const handleClearOrphanedOverrides = async () => {
    if (!selectedInstance || orphanedOverrides.length === 0) return;

    try {
      // Clear each orphaned override
      for (const override of orphanedOverrides) {
        await window.scaffa.overrides.clear({
          sessionId: selectedInstance.sessionId,
          instanceId: override.instanceId as any,
          path: override.path as any,
        });
      }
      console.log('[Inspector] Cleared orphaned overrides:', orphanedOverrides.length);
    } catch (error) {
      console.error('[Inspector] Failed to clear orphaned overrides:', error);
    }
  };

  return (
    <div className="p-4">
      <h2 className="mb-3 text-sm font-semibold text-fg">Inspector</h2>

      {/* Orphaned Overrides Warning */}
      {orphanedOverrides.length > 0 && (
        <div className="mt-4 border border-warning bg-warning-subtle px-3 py-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-warning">
                {orphanedOverrides.length} orphaned override{orphanedOverrides.length !== 1 ? 's' : ''}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Overrides that cannot be applied to the current instance.
              </p>
            </div>
            <button
              onClick={handleClearOrphanedOverrides}
              className="text-[10px] text-warning underline hover:text-warning-strong"
            >
              Clear all
            </button>
          </div>
          {/* List orphaned overrides */}
          <ul className="mt-2 space-y-1">
            {orphanedOverrides.map((override, index) => (
              <li key={index} className="font-mono text-xs text-fg-muted">
                {override.instanceId} → {override.path}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instance Descriptor Section */}
      <div className="mt-4 space-y-3 text-xs">
        {/* Component Type */}
        <div>
          <p className="text-xs font-medium text-fg-subtle">Component Type</p>
          <p className="font-medium text-fg">
            {isRegistryLoading
              ? 'Loading...'
              : registryEntry?.displayName ?? selectedInstance.componentTypeId}
          </p>
          <p className="mt-1 font-mono text-xs text-fg-muted">
            {selectedInstance.componentTypeId}
          </p>
        </div>

        {/* Instance ID */}
        <div>
          <p className="text-xs font-medium text-fg-subtle">Instance ID</p>
          <p className="font-mono text-xs text-fg">
            {selectedInstance.instanceId}
          </p>
        </div>

        {/* Display Name (if available) */}
        {selectedInstance.displayName && (
          <div>
            <p className="text-xs font-medium text-fg-subtle">Display Name</p>
            <p className="text-fg">{selectedInstance.displayName}</p>
          </div>
        )}

        {/* Session ID */}
        <div>
          <p className="text-xs font-medium text-fg-subtle">Session</p>
          <p className="font-mono text-xs text-fg">
            {selectedInstance.sessionId}
          </p>
        </div>

        {/* Override State */}
        <div>
          <p className="text-xs font-medium text-fg-subtle">Override State</p>
          <div className="mt-1 flex items-center gap-2">
            {instanceOverrideCount > 0 ? (
              <>
                <span className="inline-flex items-center bg-selected px-2 py-0.5 text-xs font-medium text-selected-fg">
                  {instanceOverrideCount} override{instanceOverrideCount !== 1 ? 's' : ''}
                </span>
              </>
            ) : (
              <span className="text-xs text-fg-muted">No overrides</span>
            )}
          </div>
        </div>

        {/* Registry Status */}
        {!isRegistryLoading && !registryEntry && (
          <div className="border border-warning bg-warning-subtle px-3 py-2">
            <p className="text-xs font-medium text-warning">
              Missing Registry Entry
            </p>
            <p className="mt-1 text-xs text-fg">
              No registry entry found for:{' '}
              <code className="font-mono">{selectedInstance.componentTypeId}</code>
            </p>
            <p className="mt-2 text-xs text-fg-muted">
              Props cannot be edited without a registry entry. The Inspector will show
              instance metadata only.
            </p>
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-warning hover:text-warning-strong">
                Debugging hints
              </summary>
              <div className="mt-2 space-y-1 text-[10px] text-fg-muted">
                <p>• Check DevTools console for detailed diagnostics</p>
                <p>• Ensure ComponentTypeId matches across:</p>
                <p className="ml-3">
                  1. Registry entry key (e.g., components[&quot;ui.button&quot;])
                </p>
                <p className="ml-3">2. Graph node id (componentType node)</p>
                <p className="ml-3">
                  3. Runtime wrapper typeId (&lt;ScaffaInstance typeId=&quot;...&quot; /&gt;)
                </p>
                {registry && Object.keys(registry.components).length > 0 && (
                  <p className="mt-2">
                    • Available registry keys:{' '}
                    <span className="font-mono">
                      {Object.keys(registry.components).join(', ')}
                    </span>
                  </p>
                )}
              </div>
            </details>
          </div>
        )}

        {/* Registry-driven prop list */}
        {registryEntry && propGroups.size > 0 && (
          <div className="border-t border-subtle pt-4">
            <h3 className="mb-3 text-xs font-semibold text-fg">Properties</h3>

            {Array.from(propGroups.entries()).map(([groupKey, props]) => (
              <div key={groupKey ?? 'ungrouped'} className="mb-4">
                {/* Group header */}
                {groupKey && (
                  <h4 className="mb-2 text-xs font-medium text-fg-subtle">
                    {groupKey}
                  </h4>
                )}

                {/* Props in this group */}
                <div className="space-y-3">
                  {props.map((propDef) => (
                    <PropField
                      key={propDef.propName}
                      propDef={propDef}
                      instanceId={selectedInstance.instanceId}
                      overrides={overrides}
                      runtimeProps={selectedInstance.props}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Extension-provided inspector sections */}
        {inspectorSections.length > 0 && selectedInstance && (
          <div className="space-y-4">
            {inspectorSections.map((section) => {
              const context: InspectorSectionContext = {
                sessionId: selectedInstance.sessionId,
                selected: {
                  instanceId: selectedInstance.instanceId,
                  componentTypeId: selectedInstance.componentTypeId,
                  displayName: selectedInstance.displayName,
                  instanceLocator: selectedInstance.instanceLocator,
                  props: selectedInstance.props,
                },
                registryEntry,
                overrides: overrides.filter(
                  (override) => override.instanceId === selectedInstance.instanceId
                ),
              };

              return (
                <div key={section.id} className="border-t border-subtle pt-4">
                  <ExtensionSection
                    section={section}
                    context={context}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PropField Component
// ─────────────────────────────────────────────────────────────────────────────

type PropFieldProps = {
  propDef: PropDefinition;
  instanceId: string;
  overrides: Array<{ instanceId: string; path: string; value: unknown }>;
  /** Runtime-provided prop values snapshot from InstanceDescriptor.props */
  runtimeProps?: Record<string, unknown>;
};

const PropField = ({ propDef, instanceId, overrides, runtimeProps }: PropFieldProps) => {
  const { propName, label, description, exposure } = propDef;
  const selectedInstance = useInspectorStore((state) => state.selectedInstance);

  // Check if this prop is overridden
  const override = overrides.find(
    (o) => o.instanceId === instanceId && o.path === `/${propName}`
  );
  const isOverridden = !!override;

  // Get baseline value from runtime props (if provided)
  const runtimeBaseline = runtimeProps?.[propName];
  const hasRuntimeBaseline = runtimeProps !== undefined && propName in (runtimeProps ?? {});

  // Local form state for editable props
  // Value resolution order: override → runtime props → uiDefaultValue → undefined
  // See: docs/scaffa_inspector_ux_semantics.md Section 1.1
  const getInitialValue = () => {
    // 1. Draft override value (top priority)
    if (isOverridden && override) {
      return override.value;
    }
    // 2. Runtime-provided baseline (if available)
    if (hasRuntimeBaseline) {
      return runtimeBaseline;
    }
    // 3. uiDefaultValue (UI metadata fallback)
    if (exposure.kind === 'editable' && exposure.uiDefaultValue !== undefined) {
      return exposure.uiDefaultValue;
    }
    // 4. Unknown baseline
    return undefined;
  };

  const [fieldValue, setFieldValue] = useState(getInitialValue);

  // Handle value changes - set override via IPC
  const handleChange = async (newValue: unknown) => {
    if (!selectedInstance) return;

    setFieldValue(newValue);

    try {
      await window.scaffa.overrides.set({
        sessionId: selectedInstance.sessionId,
        instanceId: instanceId as any, // Cast to branded type
        path: `/${propName}` as any, // Cast to branded type (PropPath)
        value: newValue,
        componentTypeId: selectedInstance.componentTypeId,
        instanceLocator: selectedInstance.instanceLocator,
      });
      console.log('[PropField] Override set:', { propName, newValue });
    } catch (error) {
      console.error('[PropField] Failed to set override:', error);
    }
  };

  // Handle reset - clear override via IPC
  // Resets to baseline value: runtime props → uiDefaultValue → undefined
  const handleReset = async () => {
    if (!selectedInstance || !isOverridden) return;

    try {
      await window.scaffa.overrides.clear({
        sessionId: selectedInstance.sessionId,
        instanceId: instanceId as any,
        path: `/${propName}` as any,
      });

      // Reset to baseline value (runtime props → uiDefaultValue → undefined)
      let baselineValue: unknown;
      if (hasRuntimeBaseline) {
        baselineValue = runtimeBaseline;
      } else if (exposure.kind === 'editable' && exposure.uiDefaultValue !== undefined) {
        baselineValue = exposure.uiDefaultValue;
      } else {
        baselineValue = undefined;
      }
      setFieldValue(baselineValue);

      console.log('[PropField] Override cleared:', { propName, resetTo: baselineValue });
    } catch (error) {
      console.error('[PropField] Failed to clear override:', error);
    }
  };

  // Display label (fallback to propName if not specified)
  const displayLabel = label ?? propName;

  return (
    <div className="space-y-1">
      {/* Label and override indicator */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-fg">
          {displayLabel}
          {isOverridden && (
            <span className="ml-2 inline-flex items-center bg-selected px-1.5 py-0.5 text-[10px] font-medium text-selected-fg">
              overridden
            </span>
          )}
        </label>

        {/* Editability indicator */}
        <span className="text-[10px] text-fg-subtle">
          {exposure.kind === 'editable' && 'Editable'}
          {exposure.kind === 'inspectOnly' && 'Read-only'}
          {exposure.kind === 'opaque' && 'Opaque'}
        </span>
      </div>

      {/* Description */}
      {description && (
        <p className="text-xs text-fg-muted">{description}</p>
      )}

      {/* Prop value display based on exposure kind */}
      {exposure.kind === 'editable' && (
        <div className="space-y-2">
          <ControlRenderer
            control={exposure.control}
            value={fieldValue}
            onChange={handleChange}
            disabled={false}
          />
          {/* Reset button for overridden props */}
          {isOverridden && (
            <button
              onClick={handleReset}
              className="text-[10px] text-fg-muted underline hover:text-fg"
            >
              Reset to default
            </button>
          )}
        </div>
      )}

      {exposure.kind === 'inspectOnly' && (
        <div className="bg-surface-card px-2 py-1.5 text-xs text-fg-muted">
          {/* Read-only value display: override → runtime baseline → unknown */}
          {isOverridden && override ? (
            <span className="font-mono">{JSON.stringify(override.value)}</span>
          ) : hasRuntimeBaseline ? (
            <span className="font-mono">{JSON.stringify(runtimeBaseline)}</span>
          ) : (
            <span className="italic">Value not available</span>
          )}
          {/* Escape hatch placeholder */}
          <button className="ml-2 text-[10px] text-fg-subtle underline hover:text-fg">
            View source →
          </button>
        </div>
      )}

      {exposure.kind === 'opaque' && (
        <div className="border border-warning bg-warning-subtle px-2 py-1.5">
          <p className="text-xs text-warning">
            Opaque value
            {exposure.reason && `: ${exposure.reason}`}
          </p>
          {/* Escape hatch */}
          <button className="mt-1 text-[10px] text-fg-subtle underline hover:text-fg">
            View source →
          </button>
        </div>
      )}
    </div>
  );
};
