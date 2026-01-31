// ─────────────────────────────────────────────────────────────────────────────
// Extension Component Types (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Types for extension UI components and the loader abstraction.

import type { ComponentType } from "react";
import type {
  InspectorSectionContribution,
  InspectorSectionContext,
} from "../../shared/inspector-sections.js";

/**
 * Props passed to extension inspector section components.
 */
export interface ExtensionSectionProps {
  context: InspectorSectionContext;
}

/**
 * A React component that can be rendered as an extension inspector section.
 */
export type ExtensionSectionComponent = ComponentType<ExtensionSectionProps>;

/**
 * Abstraction for loading extension UI components.
 *
 * v0 uses pre-bundled components (static imports at build time).
 * Future versions may use dynamic loading via skaffa:// protocol or HTTP.
 *
 * This abstraction allows swapping loading mechanisms without changing
 * extension code or registration APIs.
 */
export interface ExtensionComponentLoader {
  /**
   * Load a React component for an inspector section.
   * Returns null if the section is not found in the registry.
   */
  load(
    section: InspectorSectionContribution,
  ): Promise<ExtensionSectionComponent | null>;

  /**
   * Check if a component is available for the given section.
   */
  has(sectionId: string): boolean;
}
