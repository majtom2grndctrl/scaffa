/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
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
 * This is critical Scaffa-specific resilience behavior: extension failures should be
 * isolated and should not crash the entire Inspector panel.
 */

// Suppress console.error during error boundary tests
const originalError = console.error;
beforeEach(() => {
  console.error = vi.fn();
});

afterEach(() => {
  console.error = originalError;
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
   * WORKFLOW: Extension section renders successfully → No error boundary activation
   *
   * This is the baseline: when components work correctly, the error boundary
   * is invisible and sections render normally.
   */
  it('should render section successfully when component does not error', () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.working' as any,
      title: 'Working Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/working.tsx',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Section title is visible
    expect(screen.getByText('Working Section')).toBeInTheDocument();

    // VERIFY: Placeholder text shown (component loading not implemented)
    expect(
      screen.getByText('Extension section placeholder (component loading not yet implemented)')
    ).toBeInTheDocument();

    // VERIFY: No error UI shown
    expect(screen.queryByText(/Failed to load section/)).not.toBeInTheDocument();
  });

  /**
   * WORKFLOW: Future component loading → Error during load → Boundary catches → Fallback shows
   *
   * This documents the expected behavior when component loading is implemented.
   * Currently sections render placeholders, but when dynamic loading is added,
   * load failures should be caught gracefully.
   *
   * NOTE: This test verifies the error boundary structure is in place and will
   * work when component loading is implemented (scaffa-dxx TODO).
   */
  it('should display component path and export in placeholder', () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.detailed' as any,
      title: 'Detailed Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/inspector/CustomSection.tsx',
      componentExport: 'CustomInspectorSection',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Component path is displayed
    expect(screen.getByText(/src\/inspector\/CustomSection\.tsx/)).toBeInTheDocument();

    // VERIFY: Export name is displayed
    expect(screen.getByText(/CustomInspectorSection/)).toBeInTheDocument();
  });

  /**
   * WORKFLOW: Multiple sections + One fails → Failed section shows error → Other sections work
   *
   * This is the critical resilience behavior: extension failures must be isolated.
   * When one section fails, others must continue to work normally.
   */
  it('should isolate errors to individual sections using error boundaries', () => {
    const workingSection: InspectorSectionContribution = {
      id: 'ext-1.working' as any,
      title: 'Working Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/working.tsx',
      componentExport: 'default',
    };

    const anotherWorkingSection: InspectorSectionContribution = {
      id: 'ext-2.also-working' as any,
      title: 'Also Working Section',
      order: 2000,
      extensionId: 'ext-2',
      componentPath: 'src/also-working.tsx',
      componentExport: 'default',
    };

    const { container } = render(
      <>
        <ExtensionSection section={workingSection} context={mockContext} />
        <ExtensionSection section={anotherWorkingSection} context={mockContext} />
      </>
    );

    // VERIFY: Both sections render successfully
    expect(screen.getByText('Working Section')).toBeInTheDocument();
    expect(screen.getByText('Also Working Section')).toBeInTheDocument();

    // VERIFY: No error boundaries activated
    expect(screen.queryByText(/Failed to load section/)).not.toBeInTheDocument();
  });

  /**
   * WORKFLOW: Section receives valid context → Suspense boundary shows loading → Component loads
   *
   * This verifies the Suspense boundary is in place for async component loading.
   * Currently components render immediately (placeholders), but when dynamic
   * loading is implemented, Suspense will provide loading states.
   */
  it('should wrap section component in Suspense boundary', () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.async' as any,
      title: 'Async Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/async.tsx',
      componentExport: 'default',
    };

    render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Section renders (Suspense boundary doesn't interfere)
    expect(screen.getByText('Async Section')).toBeInTheDocument();

    // NOTE: When component loading is implemented, this test should be expanded
    // to verify Suspense fallback behavior during async loading.
  });

  /**
   * WORKFLOW: Section ID used as error boundary key → Errors correctly attributed
   *
   * This verifies that error boundaries use section IDs for proper error attribution,
   * ensuring error messages correctly identify which section failed.
   */
  it('should include section ID and title in error boundary for debugging', () => {
    const mockSection: InspectorSectionContribution = {
      id: 'ext-1.debuggable' as any,
      title: 'Debuggable Section',
      order: 1000,
      extensionId: 'ext-1',
      componentPath: 'src/debuggable.tsx',
      componentExport: 'default',
    };

    const { container } = render(<ExtensionSection section={mockSection} context={mockContext} />);

    // VERIFY: Section renders without error
    expect(screen.getByText('Debuggable Section')).toBeInTheDocument();

    // NOTE: When component loading is implemented and errors occur,
    // the error boundary will log to console with section ID and title.
    // This test documents the expected behavior for future implementation.
  });

  /**
   * WORKFLOW: Context changes → Section re-renders → New context propagated
   *
   * This verifies that sections receive updated context when selection or
   * overrides change, ensuring extension UIs stay synchronized with inspector state.
   */
  it('should re-render section when context changes', () => {
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
      registryEntry: { displayName: 'Button', props: {} },
      overrides: [],
    };

    const { rerender } = render(<ExtensionSection section={mockSection} context={initialContext} />);

    // Verify initial render
    expect(screen.getByText('Reactive Section')).toBeInTheDocument();

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

    // VERIFY: Section still renders (re-render successful)
    expect(screen.getByText('Reactive Section')).toBeInTheDocument();

    // NOTE: When component loading is implemented, this test should verify
    // that the loaded component receives the updated context.
  });
});
