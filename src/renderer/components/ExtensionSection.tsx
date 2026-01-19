import { Component, type ErrorInfo, type ReactNode, Suspense, lazy, useMemo } from 'react';
import type { InspectorSectionContribution, InspectorSectionContext } from '../../shared/inspector-sections.js';

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
  // Dynamically load the extension component
  const SectionComponent = useMemo(() => {
    // TODO(scaffa-dxx): Implement extension component loading with process isolation
    //
    // SECURITY REQUIREMENT:
    // The renderer process must NOT have direct filesystem access to load extension
    // components (docs/index.md:148-150). This preserves the security boundary.
    //
    // IMPLEMENTATION OPTIONS:
    //
    // Option 1: Custom Protocol Handler (Recommended)
    //   - Register scaffa://extension/<extensionId>/<path> protocol in main process
    //   - Main process validates extension ID and serves component from workspace
    //   - Renderer loads via dynamic import from scaffa:// URL
    //   - Pros: Clean separation, secure, supports hot reload
    //   - Cons: Requires protocol registration setup
    //
    // Option 2: Extension-Host HTTP Endpoint
    //   - Extension host runs lightweight HTTP server on localhost
    //   - Serves extension UI bundles at http://localhost:<port>/extensions/...
    //   - Main process manages lifecycle and port allocation
    //   - Pros: Standard web loading, easier debugging
    //   - Cons: Additional process complexity, CORS considerations
    //
    // Option 3: Pre-bundle into Renderer
    //   - Extension UI components are built into renderer bundle at compile time
    //   - Registry maps section IDs to pre-imported components
    //   - Pros: No runtime loading complexity, fastest
    //   - Cons: Requires renderer rebuild when extensions change, less flexible
    //
    // SELECTED APPROACH: TBD (requires design discussion)
    //
    // For v0, show a placeholder that communicates the section exists but
    // component loading is not yet implemented.

    return () => (
      <div className="px-3 py-2 border border-fg-subtle">
        <p className="text-xs font-medium text-fg">
          {section.title}
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Extension section placeholder (component loading not yet implemented)
        </p>
        <p className="mt-2 font-mono text-[10px] text-fg-subtle">
          Component: {section.componentPath}
        </p>
        <p className="font-mono text-[10px] text-fg-subtle">
          Export: {section.componentExport}
        </p>
      </div>
    );
  }, [section]);

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
        <SectionComponent context={context} />
      </Suspense>
    </ExtensionSectionErrorBoundary>
  );
};
