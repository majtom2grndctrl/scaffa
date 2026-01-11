import type {
  ComponentRegistry,
  ComponentRegistryEntry,
  PropDefinition,
  ScaffaConfig,
} from '../../shared/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// Registry Composer (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Composes module registries and applies project overrides.
// See: docs/scaffa_component_registry_schema.md

/**
 * Compose an effective registry from module registries and project config.
 *
 * Composition rules (v0):
 * 1. Start with empty registry
 * 2. Merge module registries in order (later modules win)
 * 3. Apply project overrides last
 *
 * @param moduleRegistries - Registries contributed by modules (in order)
 * @param config - Project configuration with overrides
 * @returns Effective composed registry
 */
export function composeRegistry(
  moduleRegistries: ComponentRegistry[],
  config: ScaffaConfig
): ComponentRegistry {
  const composed: ComponentRegistry = {
    schemaVersion: 'v0',
    components: {},
  };

  // Step 1: Merge module registries (later modules win)
  for (const moduleRegistry of moduleRegistries) {
    for (const [typeId, entry] of Object.entries(moduleRegistry.components)) {
      composed.components[typeId as any] = { ...entry };
    }
  }

  // Step 2: Apply project overrides
  const overrides = config.components?.overrides ?? {};

  for (const [typeId, override] of Object.entries(overrides)) {
    const existingEntry = composed.components[typeId as any];

    // If component is disabled, remove it entirely
    if (override.disabled) {
      delete composed.components[typeId as any];
      continue;
    }

    // If component doesn't exist yet, skip (can't override non-existent component)
    if (!existingEntry) {
      console.warn(
        `[Registry] Cannot override non-existent component: ${typeId}`
      );
      continue;
    }

    // Apply component-level overrides
    const composedEntry: ComponentRegistryEntry = {
      ...existingEntry,
      displayName: override.displayName ?? existingEntry.displayName,
      props: { ...existingEntry.props },
    };

    // Apply prop-level overrides
    if (override.props) {
      for (const [propName, propOverride] of Object.entries(override.props)) {
        const existingProp = composedEntry.props[propName];

        if (!existingProp) {
          console.warn(
            `[Registry] Cannot override non-existent prop: ${typeId}.${propName}`
          );
          continue;
        }

        // Merge prop definition
        const composedProp: PropDefinition = {
          ...existingProp,
          label: propOverride.label ?? existingProp.label,
          description: propOverride.description ?? existingProp.description,
          group: propOverride.group ?? existingProp.group,
          order: propOverride.order ?? existingProp.order,
        };

        // Apply exposure override if present
        if (propOverride.exposure) {
          // For v0, we do a shallow merge of exposure
          // More sophisticated merging (e.g., control options) can be added later
          composedProp.exposure = {
            ...existingProp.exposure,
            ...propOverride.exposure,
          } as any;
        }

        composedEntry.props[propName] = composedProp;
      }
    }

    composed.components[typeId as any] = composedEntry;
  }

  console.log(
    `[Registry] Composed registry: ${Object.keys(composed.components).length} components`
  );

  return composed;
}

/**
 * Get an empty registry (for use when no modules are loaded).
 */
export function getEmptyRegistry(): ComponentRegistry {
  return {
    schemaVersion: 'v0',
    components: {},
  };
}
