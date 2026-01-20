// ─────────────────────────────────────────────────────────────────────────────
// Pre-Bundle Extension Loader (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Loads extension UI components that are pre-bundled into the renderer build.
//
// This is the v0 implementation that statically imports extension components.
// Future versions may use dynamic loading via scaffa:// protocol or HTTP.
//
// MIGRATION PATH:
// - Extension component code (React) stays the same
// - Extension registration stays the same (ctx.ui.registerInspectorSection)
// - Only this loader implementation changes to support dynamic loading

import type { InspectorSectionContribution } from '../../shared/inspector-sections.js';
import type { ExtensionComponentLoader, ExtensionSectionComponent } from './types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Pre-bundled Component Registry
// ─────────────────────────────────────────────────────────────────────────────
// Maps section IDs to lazy loaders for pre-bundled components.
// Add new entries here when bundling extension UI components.

type LazyLoader = () => Promise<{ default: ExtensionSectionComponent }>;

const COMPONENT_REGISTRY: Record<string, LazyLoader> = {
  // Layout extension inspector section
  'layout.layout': () => import('./sections/LayoutSection.js'),
};

// ─────────────────────────────────────────────────────────────────────────────
// Pre-Bundle Loader Implementation
// ─────────────────────────────────────────────────────────────────────────────

class PreBundleLoader implements ExtensionComponentLoader {
  async load(section: InspectorSectionContribution): Promise<ExtensionSectionComponent | null> {
    const loader = COMPONENT_REGISTRY[section.id];

    if (!loader) {
      console.warn(
        `[PreBundleLoader] No pre-bundled component for section: ${section.id}`,
        '\n  → componentPath:', section.componentPath,
        '\n  → To add this component, update COMPONENT_REGISTRY in pre-bundle-loader.ts'
      );
      return null;
    }

    try {
      const module = await loader();
      return module.default;
    } catch (error) {
      console.error(`[PreBundleLoader] Failed to load component for section: ${section.id}`, error);
      return null;
    }
  }

  has(sectionId: string): boolean {
    return sectionId in COMPONENT_REGISTRY;
  }
}

// Export singleton instance
export const extensionLoader: ExtensionComponentLoader = new PreBundleLoader();
