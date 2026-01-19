// ─────────────────────────────────────────────────────────────────────────────
// Inspector Section Registry (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Manages inspector sections contributed by extension modules.

import type {
  InspectorSectionContribution,
  InspectorSectionId,
} from '../../shared/inspector-sections.js';

class InspectorSectionRegistry {
  private sections: Map<InspectorSectionId, InspectorSectionContribution> = new Map();

  /**
   * Register an inspector section from an extension.
   */
  registerSection(section: InspectorSectionContribution): void {
    this.sections.set(section.id, section);
    console.log(`[InspectorSectionRegistry] Registered section: ${section.id} (${section.title})`);
  }

  /**
   * Unregister an inspector section.
   */
  unregisterSection(sectionId: InspectorSectionId): void {
    this.sections.delete(sectionId);
    console.log(`[InspectorSectionRegistry] Unregistered section: ${sectionId}`);
  }

  /**
   * Get all registered sections sorted by order.
   */
  getSections(): InspectorSectionContribution[] {
    const sections = Array.from(this.sections.values());
    // Sort by order (ascending)
    sections.sort((a, b) => a.order - b.order);
    return sections;
  }

  /**
   * Get a specific section by ID.
   */
  getSection(sectionId: InspectorSectionId): InspectorSectionContribution | undefined {
    return this.sections.get(sectionId);
  }

  /**
   * Clear all registered sections.
   */
  clear(): void {
    this.sections.clear();
    console.log('[InspectorSectionRegistry] Cleared all sections');
  }
}

// Singleton instance
export const inspectorSectionRegistry = new InspectorSectionRegistry();
