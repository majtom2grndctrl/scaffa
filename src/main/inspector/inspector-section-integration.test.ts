import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { inspectorSectionRegistry } from './inspector-section-registry.js';
import type { InspectorSectionContribution } from '../../shared/inspector-sections.js';
import type { InspectorSectionRegisteredMessage } from '../../extension-host/ipc-protocol.js';

/**
 * Integration tests for inspector section registration workflow.
 *
 * These tests verify the end-to-end flow of inspector section contributions
 * from extension modules to the renderer UI:
 *
 * Extension Module → IPC → Main Process → Registry → IPC → Renderer
 *
 * This is Scaffa-specific cross-process communication behavior that AI agents
 * and developers need visibility into.
 */
describe('Inspector Section Registration Workflow (Integration)', () => {
  beforeEach(() => {
    inspectorSectionRegistry.clear();
  });

  afterEach(() => {
    inspectorSectionRegistry.clear();
  });

  /**
   * WORKFLOW: Extension calls ctx.ui.registerInspectorSection() → Main receives → Registry stores
   *
   * This simulates the actual IPC flow when an extension module registers an inspector section.
   * Critical sequence: Extension host sends message → Main handler receives → Registry stores
   */
  it('should handle extension registration flow end-to-end', () => {
    // STEP 1: Extension module calls ctx.ui.registerInspectorSection()
    // This creates an IPC message to main process
    const sectionFromExtension: InspectorSectionContribution = {
      id: 'ext-1.custom-props' as any,
      title: 'Custom Properties',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/inspector/CustomPropsSection.tsx',
      componentExport: 'CustomPropsSection',
    };

    // STEP 2: Extension host sends IPC message to main
    const ipcMessage: InspectorSectionRegisteredMessage = {
      type: 'inspector-section-registered',
      section: sectionFromExtension,
    };

    // STEP 3: Main process handler receives message and registers section
    // (This simulates ExtensionHostManager.handleInspectorSectionRegistered)
    inspectorSectionRegistry.registerSection(ipcMessage.section);

    // STEP 4: Verify section is stored in main process registry
    const sections = inspectorSectionRegistry.getSections();
    expect(sections).toHaveLength(1);
    expect(sections[0]).toEqual(sectionFromExtension);
  });

  /**
   * WORKFLOW: Renderer requests sections → Main fetches from registry → Renderer receives
   *
   * This tests the IPC flow when the renderer fetches inspector sections on initialization.
   * Critical sequence: Renderer IPC call → Main handler → Registry getSections() → Response
   */
  it('should provide sections to renderer via IPC handler flow', () => {
    // SETUP: Extension has registered sections in main process
    const section1: InspectorSectionContribution = {
      id: 'ext-1.diagnostics' as any,
      title: 'Diagnostics',
      order: 500,
      extensionId: 'ext-1',
      componentPath: 'src/inspector/DiagnosticsSection.tsx',
      componentExport: 'default',
    };

    const section2: InspectorSectionContribution = {
      id: 'ext-2.performance' as any,
      title: 'Performance',
      order: 600,
      extensionId: 'ext-2',
      componentPath: 'src/inspector/PerformanceSection.tsx',
      componentExport: 'PerformanceSection',
    };

    inspectorSectionRegistry.registerSection(section1);
    inspectorSectionRegistry.registerSection(section2);

    // WORKFLOW: Renderer calls window.scaffa.inspector.getSections()
    // → IPC to main → inspector:getSections handler
    // → inspectorSectionRegistry.getSections()
    // → Returns sections to renderer
    const sections = inspectorSectionRegistry.getSections();

    // VERIFY: Renderer receives all registered sections
    expect(sections).toHaveLength(2);
    expect(sections[0].id).toBe('ext-1.diagnostics');
    expect(sections[1].id).toBe('ext-2.performance');
  });

  /**
   * WORKFLOW: Multiple extensions register → Registry preserves order → Renderer sees correct sort
   *
   * This verifies that section ordering is preserved across the IPC boundary.
   * Critical for UI predictability: extensions with lower order numbers appear first.
   */
  it('should preserve section order across extension registration and renderer fetch', () => {
    // STEP 1: Multiple extensions register sections in random order
    const highOrderSection: InspectorSectionContribution = {
      id: 'ext-1.advanced' as any,
      title: 'Advanced',
      order: 2000,
      extensionId: 'ext-1',
      componentPath: 'src/advanced.tsx',
      componentExport: 'default',
    };

    const lowOrderSection: InspectorSectionContribution = {
      id: 'ext-2.basics' as any,
      title: 'Basics',
      order: 100,
      extensionId: 'ext-2',
      componentPath: 'src/basics.tsx',
      componentExport: 'default',
    };

    const midOrderSection: InspectorSectionContribution = {
      id: 'ext-3.standard' as any,
      title: 'Standard',
      order: 1000,
      extensionId: 'ext-3',
      componentPath: 'src/standard.tsx',
      componentExport: 'default',
    };

    // Register in intentionally wrong order
    inspectorSectionRegistry.registerSection(highOrderSection);
    inspectorSectionRegistry.registerSection(lowOrderSection);
    inspectorSectionRegistry.registerSection(midOrderSection);

    // STEP 2: Renderer fetches sections via IPC
    const sections = inspectorSectionRegistry.getSections();

    // VERIFY: Sections are sorted by order (ascending)
    expect(sections).toHaveLength(3);
    expect(sections[0].id).toBe('ext-2.basics'); // order: 100
    expect(sections[1].id).toBe('ext-3.standard'); // order: 1000
    expect(sections[2].id).toBe('ext-1.advanced'); // order: 2000
  });

  /**
   * WORKFLOW: Extension host restart → Registry cleared → Extensions re-register → Renderer sees fresh state
   *
   * This tests the critical cleanup sequence when the extension host restarts.
   * Without proper clearing, stale sections would persist and cause UI bugs.
   *
   * Critical sequence:
   * 1. Extensions register sections
   * 2. Extension host restarts (ExtensionHostManager.restart())
   * 3. Registry cleared (inspectorSectionRegistry.clear())
   * 4. Extensions re-register on startup
   * 5. Renderer fetches fresh sections
   */
  it('should clear sections on extension host restart and allow re-registration', () => {
    // STEP 1: Initial extension registration
    const originalSection: InspectorSectionContribution = {
      id: 'ext-1.props' as any,
      title: 'Properties (v1)',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/inspector/PropsV1.tsx',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(originalSection);
    expect(inspectorSectionRegistry.getSections()).toHaveLength(1);

    // STEP 2: Extension host restarts (simulates ExtensionHostManager.restart())
    // This MUST clear the registry to prevent stale sections
    inspectorSectionRegistry.clear();

    // VERIFY: Stale sections are gone
    expect(inspectorSectionRegistry.getSections()).toHaveLength(0);

    // STEP 3: Extensions re-register on startup (potentially with updated metadata)
    const updatedSection: InspectorSectionContribution = {
      id: 'ext-1.props' as any,
      title: 'Properties (v2)', // Updated title
      order: 500, // Updated order
      extensionId: 'ext-1',
      componentPath: 'src/inspector/PropsV2.tsx', // Updated component
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(updatedSection);

    // STEP 4: Renderer fetches sections
    const sections = inspectorSectionRegistry.getSections();

    // VERIFY: Renderer sees updated section, not stale version
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Properties (v2)');
    expect(sections[0].order).toBe(500);
    expect(sections[0].componentPath).toBe('src/inspector/PropsV2.tsx');
  });

  /**
   * WORKFLOW: Extension registers duplicate section ID → Registry overwrites → Renderer sees latest
   *
   * This documents the registry's overwrite behavior for duplicate IDs.
   * Important for extension development: re-registering the same ID updates the section.
   */
  it('should handle duplicate section IDs by overwriting (last wins)', () => {
    // STEP 1: Extension registers section
    const firstRegistration: InspectorSectionContribution = {
      id: 'ext-1.shared-id' as any,
      title: 'First Registration',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/first.tsx',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(firstRegistration);

    // STEP 2: Same extension (or different extension) registers same ID
    const secondRegistration: InspectorSectionContribution = {
      id: 'ext-1.shared-id' as any, // Same ID
      title: 'Second Registration',
      order: 2000,
      extensionId: 'ext-1',
      componentPath: 'src/second.tsx',
      componentExport: 'default',
    };

    inspectorSectionRegistry.registerSection(secondRegistration);

    // VERIFY: Registry contains only one entry (overwritten)
    const sections = inspectorSectionRegistry.getSections();
    expect(sections).toHaveLength(1);
    expect(sections[0].title).toBe('Second Registration');
    expect(sections[0].order).toBe(2000);
  });

  /**
   * WORKFLOW: No extensions register → Renderer requests → Empty array returned
   *
   * This tests the baseline case: inspector works when no extensions contribute sections.
   */
  it('should handle empty registry gracefully when no extensions register sections', () => {
    // Renderer fetches sections when no extensions have registered
    const sections = inspectorSectionRegistry.getSections();

    // VERIFY: Empty array, no errors
    expect(sections).toEqual([]);
    expect(sections).toHaveLength(0);
  });
});
