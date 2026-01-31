/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ExtensionSection } from './ExtensionSection';
import type {
  InspectorSectionContribution,
  InspectorSectionContext,
} from '../../shared/inspector-sections.js';

/**
 * Integration tests for extension section error handling workflow.
 *
 * These tests verify the error boundary behavior when extension-provided
 * components fail:
 *
 * Section component throws → Error boundary catches → Fallback displays → Inspector survives
 *
 * This is critical Skaffa-specific resilience behavior: extension failures should be
 * isolated and should not crash the entire Inspector panel.
 */

// Suppress console.error during error boundary tests
const originalError = console.error;
let warnSpy: ReturnType<typeof vi.spyOn> | null = null;
beforeEach(() => {
  console.error = vi.fn();
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  console.error = originalError;
  warnSpy?.mockRestore();
  warnSpy = null;
});

describe('Extension Section Error Handling Workflow (Integration)', () => {
  const mockContext: InspectorSectionContext = {
    sessionId: 'session-1' as any,
    selected: {
      instanceId: 'instance-1' as any,
      componentTypeId: 'ui.button' as any,
      displayName: 'Submit Button',
      instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
      props: { variant: 'primary' },
    },
    registryEntry: {
      displayName: 'Button',
      props: {},
    },
    overrides: [],
  };

  /**
   * WORKFLOW: Extension section renders → Component loading starts → Shows loading state
   *
   * When component loading is implemented, the section first shows a loading state
   * while the component is being dynamically loaded. For unknown sections (not in
   * the pre-bundle registry), it will show an error.
   */
  it('should render loading state then error for unknown sections', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.working' as any,
      title: 'Working Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/working.tsx',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Shows loading state initially
    expect(screen.getByText(/Loading Working Section/)).toBeInTheDocument();

    // VERIFY: After loading, shows error for unknown section (not in pre-bundle registry)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    });

    // VERIFY: Error shows component path for debugging
    expect(screen.getByText(/src\/working\.tsx/)).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Unknown section loads → Error state shows component path and export
   *
   * When an unknown section (not in the pre-bundle registry) loads, it shows
   * an error state with debugging information including component path and export.
   */
  it('should display component path and export in error state for unknown sections', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.detailed' as any,
      title: 'Detailed Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/inspector/CustomSection.tsx',
      componentExport: 'CustomInspectorSection',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    });

    // VERIFY: Component path is displayed
    expect(screen.getByText(/src\/inspector\/CustomSection\.tsx/)).toBeInTheDocument();

    // VERIFY: Export name is displayed
    expect(screen.getByText(/CustomInspectorSection/)).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Multiple sections load → Each section has its own loading state
   *
   * This tests that multiple sections can load independently. Each section
   * shows its own loading state and transitions independently.
   */
  it('should show loading state for each section independently', async () => {
    const section1: InspectorSectionContribution = {
      id: 'ext-1.section1' as any,
      title: 'Section One',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/section1.tsx',
      componentExport: 'default',
    };

    const section2: InspectorSectionContribution = {
      id: 'ext-2.section2' as any,
      title: 'Section Two',
      order: 2000,
      extensionId: 'ext-2',
      componentPath: 'src/section2.tsx',
      componentExport: 'default',
    };

    render(
      <>
        <ExtensionSection section={section1} context={mockContext} />
        <ExtensionSection section={section2} context={mockContext} />
      </>
    );

    // VERIFY: Both sections show loading state initially
    expect(screen.getByText(/Loading Section One/)).toBeInTheDocument();
    expect(screen.getByText(/Loading Section Two/)).toBeInTheDocument();

    // Wait for loading to complete
    await waitFor(() => {
      // Both should show error for unknown sections
      const errors = screen.getAllByText(/Failed to load extension section/);
      expect(errors).toHaveLength(2);
    });
  });

  /**
   * WORKFLOW: Section starts loading → Shows loading state with section title
   *
   * This verifies that the loading state includes the section title so users
   * can identify which section is loading.
   */
  it('should show section title in loading state', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.async' as any,
      title: 'Async Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/async.tsx',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Loading state shows section title
    expect(screen.getByText(/Loading Async Section/)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    });
  });

  /**
   * WORKFLOW: Section shows error → Error includes section title for debugging
   *
   * This verifies that error states include the section title so developers
   * can identify which section failed to load.
   */
  it('should include section title in error state for debugging', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.debuggable' as any,
      title: 'Debuggable Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/debuggable.tsx',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // Wait for error state
    await waitFor(() => {
      // VERIFY: Section title is visible in error state
      expect(screen.getByText('Debuggable Section')).toBeInTheDocument();
    });

    // VERIFY: Error message is shown
    expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Context changes → Section re-renders → New context propagated
   *
   * This verifies that sections receive updated context when selection or
   * overrides change, ensuring extension UIs stay synchronized with inspector state.
   */
  it('should preserve section state when context changes', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.reactive' as any,
      title: 'Reactive Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/reactive.tsx',
      componentExport: 'default',
    };

    const initialContext: InspectorSectionContext = {
      sessionId: 'session-1' as any,
      selected: {
        instanceId: 'instance-1' as any,
        componentTypeId: 'ui.button' as any,
        displayName: 'Submit Button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        props: {},
      },
      registryEntry: { displayName: 'Button', props: {}, typeId: 'ui.button' as any },
      overrides: [],
    };

    const { rerender } = render(<ExtensionSection section={mockSection} context={initialContext} />);

    // Wait for initial load (error state for unknown section)
    await waitFor(() => {
      expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    });

    // Update context (simulating override change)
    const updatedContext: InspectorSectionContext = {
      ...initialContext,
      overrides: [
        {
          instanceId: 'instance-1' as any,
          path: '/variant' as any,
          value: 'secondary',
        },
      ],
    };

    rerender(<ExtensionSection section={mockSection} context={updatedContext} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    });

    // VERIFY: Section still shows error state (same section, same loading state)
    expect(screen.getByText(/Failed to load extension section/)).toBeInTheDocument();
    expect(screen.getByText('Reactive Section')).toBeInTheDocument();

    // NOTE: When the pre-bundle registry includes this component,
    // this test should verify that the loaded component receives the updated context.
  });
});

/**
 * Success-path integration test for extension section loading.
 *
 * This tests the happy path: a component is found in the pre-bundle registry
 * and renders successfully with the provided context.
 */
describe('Extension Section Success Path (Integration)', () => {
  const mockContext: InspectorSectionContext = {
    sessionId: 'session-1' as any,
    selected: {
      instanceId: 'instance-1' as any,
      componentTypeId: 'layout.box' as any,
      displayName: 'Box',
      instanceLocator: { type: 'instancePath', path: '/app/box[0]' },
      props: {},
    },
    registryEntry: {
      displayName: 'Box',
      props: {},
    },
    overrides: [],
  };

  /**
   * WORKFLOW: Known section loads → Component renders → Context passed to component
   *
   * The layout.layout section is in the pre-bundle registry, so it should
   * load successfully and render the LayoutSection component.
   */
  it('should render pre-bundled component for known section (layout.layout)', async () => {
    const mockSection: InspectorSectionContribution = {
      id: 'layout.layout' as any,
      title: 'Layout',
      order: 1000,
      extensionId: 'layout',
      componentPath: 'inspector-sections/LayoutSection',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Shows loading state initially
    expect(screen.getByText(/Loading Layout/)).toBeInTheDocument();

    // VERIFY: After loading, the LayoutSection component renders
    // The LayoutSection shows "Layout" as a heading for layout components
    await waitFor(() => {
      // LayoutSection renders a form with heading "Layout"
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    // VERIFY: Component receives registry entry display name
    expect(screen.getByText('Box')).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Section renders → Guards against non-layout types → Returns null
   *
   * The LayoutSection has internal guards that return null for non-layout
   * component types. This tests that the section gracefully handles this.
   */
  it('should handle component returning null for non-applicable context', async () => {
    const nonLayoutContext: InspectorSectionContext = {
      sessionId: 'session-1' as any,
      selected: {
        instanceId: 'instance-1' as any,
        componentTypeId: 'ui.button' as any, // Not a layout type
        displayName: 'Button',
        instanceLocator: { type: 'instancePath', path: '/app/button[0]' },
        props: {},
      },
      registryEntry: {
        displayName: 'Button',
        props: {},
      },
      overrides: [],
    };

    const mockSection: InspectorSectionContribution = {
      id: 'layout.layout' as any,
      title: 'Layout',
      order: 1000,
      extensionId: 'layout',
      componentPath: 'inspector-sections/LayoutSection',
      componentExport: 'default',
    };

    const { container } = render(<ExtensionSection section={mockSection} context={nonLayoutContext} />);

    // Wait for loading to complete
    await waitFor(() => {
      // Loading state should disappear
      expect(screen.queryByText(/Loading Layout/)).not.toBeInTheDocument();
    });

    // VERIFY: LayoutSection returns null, so no form is rendered
    expect(screen.queryByRole('form')).not.toBeInTheDocument();

    // VERIFY: The Suspense wrapper still renders an empty container
    // (no error, just empty content from the component returning null)
    expect(container.querySelector('[class*="border-error"]')).not.toBeInTheDocument();
  });
});
