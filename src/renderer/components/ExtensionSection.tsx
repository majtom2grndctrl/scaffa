import { Component, type ErrorInfo, type ReactNode, Suspense, useState, useEffect } from 'react';
import type { InspectorSectionContribution, InspectorSectionContext } from '../../shared/inspector-sections.js';
import { extensionLoader } from '../extensions/pre-bundle-loader.js';
import type { ExtensionSectionComponent } from '../extensions/types.js';

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary for Extension Sections
// ─────────────────────────────────────────────────────────────────────────────

interface ErrorBoundaryProps {
  children: ReactNode;
  sectionId: string;
  sectionTitle: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ExtensionSectionErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error(
      `[ExtensionSection] Error in section ${this.props.sectionId} (${this.props.sectionTitle}):`,
      error,
      errorInfo
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="border border-error bg-error-subtle px-3 py-2">
          <p className="text-xs font-medium text-error">
            Failed to load section: {this.props.sectionTitle}
          </p>
          <p className="mt-1 text-xs text-fg-muted">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-error hover:text-error-strong">
              Error details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto text-[10px] text-fg-muted">
              {this.state.error?.stack || 'No stack trace available'}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Extension Section Component
// ─────────────────────────────────────────────────────────────────────────────

interface ExtensionSectionProps {
  section: InspectorSectionContribution;
  context: InspectorSectionContext;
}

export const ExtensionSection = ({ section, context }: ExtensionSectionProps) => {
  const [LoadedComponent, setLoadedComponent] = useState<ExtensionSectionComponent | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load the extension component
  useEffect(() => {
    let cancelled = false;

    const loadComponent = async () => {
      setIsLoading(true);
      setLoadError(null);

      try {
        const component = await extensionLoader.load(section);
        if (cancelled) return;

        if (component) {
          setLoadedComponent(() => component);
        } else {
          setLoadError(`Component not found for section: ${section.id}`);
        }
      } catch (error) {
        if (cancelled) return;
        console.error(`[ExtensionSection] Failed to load section ${section.id}:`, error);
        setLoadError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadComponent();

    return () => {
      cancelled = true;
    };
    // Note: We only depend on section.id because sections are static registrations.
    // If section.componentPath changes without section.id changing, this won't reload.
    // This is acceptable for v0 where sections are registered at activation time.
  }, [section.id]);

  // Loading state
  if (isLoading) {
    return (
      <div className="px-3 py-2 text-xs text-fg-subtle">
        Loading {section.title}...
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="border border-warning bg-warning-subtle px-3 py-2">
        <p className="text-xs font-medium text-warning">
          {section.title}
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Failed to load extension section: {loadError}
        </p>
        <p className="mt-2 font-mono text-[10px] text-fg-subtle">
          Component: {section.componentPath}
        </p>
        <p className="font-mono text-[10px] text-fg-subtle">
          Export: {section.componentExport}
        </p>
      </div>
    );
  }

  // No component loaded
  if (!LoadedComponent) {
    return null;
  }

  return (
    <ExtensionSectionErrorBoundary
      sectionId={section.id}
      sectionTitle={section.title}
    >
      <Suspense
        fallback={
          <div className="px-3 py-2 text-xs text-fg-subtle">
            Loading {section.title}...
          </div>
        }
      >
        <LoadedComponent context={context} />
      </Suspense>
    </ExtensionSectionErrorBoundary>
  );
};
