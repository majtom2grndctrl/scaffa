// ─────────────────────────────────────────────────────────────────────────────
// Scaffa React Router Integration (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Runtime capture of active router state for React Router data-router API.

import { useEffect } from 'react';
import { useLocation, useMatches } from 'react-router-dom';
import { useScaffaContext } from './provider.js';

/**
 * Hook to capture and report React Router state changes to Scaffa.
 *
 * This hook should be placed in a component that is rendered within the router
 * (e.g., in your root route component or a layout component).
 *
 * @example
 * ```tsx
 * import { useScaffaRouterState } from '@scaffa/react-runtime-adapter';
 *
 * function App() {
 *   useScaffaRouterState();
 *   return <div>...</div>;
 * }
 * ```
 */
export function useScaffaRouterState(): void {
  const { adapter } = useScaffaContext();
  const location = useLocation();
  const matches = useMatches();

  useEffect(() => {
    // Extract route IDs and paths from matched routes
    const matchedRouteIds = matches
      .map((match) => match.id)
      .filter((id): id is string => !!id);

    const matchedPaths = matches
      .map((match) => match.pathname)
      .filter((path): path is string => !!path);

    // Emit router state to Scaffa host
    adapter.emitRouterStateChanged({
      pathname: location.pathname,
      matchedRouteIds: matchedRouteIds.length > 0 ? matchedRouteIds : undefined,
      matchedPaths: matchedPaths.length > 0 ? matchedPaths : undefined,
    });
  }, [adapter, location, matches]);
}
