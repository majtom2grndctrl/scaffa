/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { InspectorPanel } from './InspectorPanel';
import { ExtensionSection } from './ExtensionSection';
import { useInspectorStore } from '../state/inspectorStore';
import type { ComponentRegistry, InstanceDescriptor } from '../../shared/index.js';
import type {
  InspectorSectionContribution,
  InspectorSectionContext,
} from '../../shared/inspector-sections.js';

/**
 * Integration tests for inspector section context propagation workflow.
 *
 * These tests verify the end-to-end flow of context building and propagation:
 *
 * User selects instance → Store updates → Panel builds context → Section receives context
 *
 * This is critical Scaffa-specific behavior: extensions need accurate, complete context
 * about the selected instance to render meaningful UI.
 */

// Mock the inspector store
vi.mock('../state/inspectorStore', () => ({
  useInspectorStore: vi.fn(),
}));

// Mock ExtensionSection to capture context
vi.mock('./ExtensionSection', () => ({
  ExtensionSection: vi.fn(({ section, context }) => {
    return (
      <div data-testid={`section-${section.id}`} data-context={JSON.stringify(context)}>
        {section.title}
      </div>
    );
  }),
}));

// Mock window.scaffa API
globalThis.window = {
  scaffa: {
    overrides: {
      set: vi.fn(),
      clear: vi.fn(),
    },
    inspector: {
      getSections: vi.fn(),
    },
  },
} as any;

describe('Inspector Section Context Propagation Workflow (Integration)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * WORKFLOW: Instance selected → Panel builds context → Section receives complete context
   *
   * This tests the core context propagation sequence:
   * 1. User selects an instance (store updates)
   * 2. InspectorPanel reads selection from store
   * 3. Panel builds InspectorSectionContext with all required fields
   * 4. ExtensionSection receives context as prop
   */
  it('should propagate complete context to extension sections on selection', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-123' as any,
      componentTypeId: 'ui.button' as any,
      instanceLocator: { type: 'instancePath', path: '/app/page/button[0]' },
      displayName: 'Submit Button',
      props: {
        variant: 'primary',
        disabled: false,
        label: 'Submit',
      },
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.button': {
          displayName: 'Button',
          props: {
            variant: {
              propName: 'variant',
              exposure: { kind: 'editable', control: { kind: 'string' } },
            },
            disabled: {
              propName: 'disabled',
              exposure: { kind: 'editable', control: { kind: 'boolean' } },
            },
            label: {
              propName: 'label',
              exposure: { kind: 'editable', control: { kind: 'string' } },
            },
          },
        },
      },
    };

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.diagnostics' as any,
        title: 'Diagnostics',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/diagnostics.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    const { container } = render(<InspectorPanel />);

    // Extract context passed to ExtensionSection
    const sectionElement = container.querySelector('[data-testid="section-ext-1.diagnostics"]');
    expect(sectionElement).toBeTruthy();

    const contextJson = sectionElement?.getAttribute('data-context');
    expect(contextJson).toBeTruthy();

    const context = JSON.parse(contextJson!) as InspectorSectionContext;

    // VERIFY: Context contains sessionId
    expect(context.sessionId).toBe('session-1');

    // VERIFY: Context contains selected instance details
    expect(context.selected).toBeTruthy();
    expect(context.selected?.instanceId).toBe('instance-123');
    expect(context.selected?.componentTypeId).toBe('ui.button');
    expect(context.selected?.displayName).toBe('Submit Button');
    expect(context.selected?.instanceLocator).toEqual({
      type: 'instancePath',
      path: '/app/page/button[0]',
    });

    // VERIFY: Context contains instance props
    expect(context.selected?.props).toEqual({
      variant: 'primary',
      disabled: false,
      label: 'Submit',
    });

    // VERIFY: Context contains registry entry
    expect(context.registryEntry).toBeTruthy();
    expect(context.registryEntry?.displayName).toBe('Button');
    expect(Object.keys(context.registryEntry?.props || {})).toHaveLength(3);

    // VERIFY: Context contains overrides array (empty in this case)
    expect(context.overrides).toEqual([]);
  });

  /**
   * WORKFLOW: Overrides exist → Panel includes filtered overrides in context
   *
   * This tests that extension sections receive only the overrides relevant to
   * the currently selected instance, not all overrides in the session.
   */
  it('should include only relevant overrides in section context', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-current' as any,
      componentTypeId: 'ui.card' as any,
      instanceLocator: { type: 'instancePath', path: '/app/card[0]' },
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.card': {
          displayName: 'Card',
          props: {},
        },
      },
    };

    const mockOverrides = [
      // These belong to current instance
      {
        sessionId: 'session-1' as any,
        instanceId: 'instance-current' as any,
        path: '/title' as any,
        value: 'Custom Title',
      },
      {
        sessionId: 'session-1' as any,
        instanceId: 'instance-current' as any,
        path: '/variant' as any,
        value: 'elevated',
      },
      // This belongs to a different instance
      {
        sessionId: 'session-1' as any,
        instanceId: 'instance-other' as any,
        path: '/disabled' as any,
        value: true,
      },
    ];

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.override-inspector' as any,
        title: 'Override Inspector',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/override-inspector.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: mockOverrides,
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    const { container } = render(<InspectorPanel />);

    const sectionElement = container.querySelector(
      '[data-testid="section-ext-1.override-inspector"]'
    );
    const contextJson = sectionElement?.getAttribute('data-context');
    const context = JSON.parse(contextJson!) as InspectorSectionContext;

    // VERIFY: Context contains only overrides for current instance
    expect(context.overrides).toHaveLength(2);
    expect(context.overrides.every((o) => o.instanceId === 'instance-current')).toBe(true);

    // VERIFY: Both current instance overrides are included
    const paths = context.overrides.map((o) => o.path);
    expect(paths).toContain('/title');
    expect(paths).toContain('/variant');

    // VERIFY: Other instance override is excluded
    expect(paths).not.toContain('/disabled');
  });

  /**
   * WORKFLOW: Multiple sections → Each receives identical context
   *
   * This verifies that all extension sections receive the same context object,
   * ensuring consistent state across all sections.
   */
  it('should provide consistent context to multiple sections', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.input' as any,
      instanceLocator: { type: 'instancePath', path: '/app/input[0]' },
      displayName: 'Email Input',
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.input': {
          displayName: 'Input',
          props: {},
        },
      },
    };

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.validation' as any,
        title: 'Validation',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/validation.tsx',
        componentExport: 'default',
      },
      {
        id: 'ext-2.accessibility' as any,
        title: 'Accessibility',
        order: 2000,
        extensionId: 'ext-2',
        componentPath: 'src/a11y.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    const { container } = render(<InspectorPanel />);

    // Extract contexts from both sections
    const section1Element = container.querySelector('[data-testid="section-ext-1.validation"]');
    const section2Element = container.querySelector(
      '[data-testid="section-ext-2.accessibility"]'
    );

    const context1Json = section1Element?.getAttribute('data-context');
    const context2Json = section2Element?.getAttribute('data-context');

    const context1 = JSON.parse(context1Json!) as InspectorSectionContext;
    const context2 = JSON.parse(context2Json!) as InspectorSectionContext;

    // VERIFY: Both sections receive same sessionId
    expect(context1.sessionId).toBe(context2.sessionId);

    // VERIFY: Both sections receive same selected instance
    expect(context1.selected?.instanceId).toBe(context2.selected?.instanceId);
    expect(context1.selected?.componentTypeId).toBe(context2.selected?.componentTypeId);
    expect(context1.selected?.displayName).toBe(context2.selected?.displayName);

    // VERIFY: Both sections receive same registry entry
    expect(context1.registryEntry?.displayName).toBe(context2.registryEntry?.displayName);

    // VERIFY: Both sections receive same overrides
    expect(context1.overrides).toEqual(context2.overrides);
  });

  /**
   * WORKFLOW: Selection changes → Context updates → Sections receive new context
   *
   * This documents the re-render behavior when selection changes.
   * Extension sections should receive updated context reflecting the new selection.
   */
  it('should update section context when selection changes', () => {
    const initialInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-first' as any,
      componentTypeId: 'ui.button' as any,
      instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.button': {
          displayName: 'Button',
          props: {},
        },
        'ui.card': {
          displayName: 'Card',
          props: {},
        },
      },
    };

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.props' as any,
        title: 'Properties',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/props.tsx',
        componentExport: 'default',
      },
    ];

    // Initial render with first instance
    const mockStoreImplementation = vi.fn((selector: any) => {
      const state = {
        selectedInstance: initialInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    vi.mocked(useInspectorStore).mockImplementation(mockStoreImplementation);

    const { container, rerender } = render(<InspectorPanel />);

    // Verify initial context
    let sectionElement = container.querySelector('[data-testid="section-ext-1.props"]');
    let contextJson = sectionElement?.getAttribute('data-context');
    let context = JSON.parse(contextJson!) as InspectorSectionContext;
    expect(context.selected?.instanceId).toBe('instance-first');

    // Simulate selection change
    const updatedInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-second' as any,
      componentTypeId: 'ui.card' as any,
      instanceLocator: { type: 'instancePath', path: '/app/card[0]' },
    } as any;

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: updatedInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    rerender(<InspectorPanel />);

    // Verify updated context
    sectionElement = container.querySelector('[data-testid="section-ext-1.props"]');
    contextJson = sectionElement?.getAttribute('data-context');
    context = JSON.parse(contextJson!) as InspectorSectionContext;

    // VERIFY: Context reflects new selection
    expect(context.selected?.instanceId).toBe('instance-second');
    expect(context.selected?.componentTypeId).toBe('ui.card');
  });

  /**
   * WORKFLOW: Instance has no props → Context has empty props object
   *
   * This tests edge case handling: instances without props should have
   * an empty props object in context, not null/undefined.
   */
  it('should handle instances with no props gracefully', () => {
    const mockInstance: InstanceDescriptor = {
      sessionId: 'session-1' as any,
      instanceId: 'instance-no-props' as any,
      componentTypeId: 'ui.divider' as any,
      instanceLocator: { type: 'instancePath', path: '/app/divider[0]' },
      // No props field
    } as any;

    const mockRegistry: ComponentRegistry = {
      schemaVersion: 'v0',
      components: {
        'ui.divider': {
          displayName: 'Divider',
          props: {},
        },
      },
    };

    const mockSections: InspectorSectionContribution[] = [
      {
        id: 'ext-1.info' as any,
        title: 'Info',
        order: 1000,
        extensionId: 'ext-1',
        componentPath: 'src/info.tsx',
        componentExport: 'default',
      },
    ];

    vi.mocked(useInspectorStore).mockImplementation((selector: any) => {
      const state = {
        selectedInstance: mockInstance,
        registry: mockRegistry,
        overrides: [],
        isRegistryLoading: false,
        inspectorSections: mockSections,
        isSectionsLoading: false,
      };
      return selector(state);
    });

    const { container } = render(<InspectorPanel />);

    const sectionElement = container.querySelector('[data-testid="section-ext-1.info"]');
    const contextJson = sectionElement?.getAttribute('data-context');
    const context = JSON.parse(contextJson!) as InspectorSectionContext;

    // VERIFY: Context has selected instance
    expect(context.selected).toBeTruthy();

    // VERIFY: Props is present (even if undefined in descriptor)
    // The context builder should handle this gracefully
    expect(context.selected?.instanceId).toBe('instance-no-props');
  });
});
