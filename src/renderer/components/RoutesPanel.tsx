// ─────────────────────────────────────────────────────────────────────────────
// Routes Panel (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Displays route list from Project Graph with navigation and active highlight.

import { useMemo, useState } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useSessionStore } from '../state/sessionStore';
import type { GraphNode } from '../../shared/project-graph';

interface RouteInfo {
  id: string;
  path: string;
  source?: string;
}

export const RoutesPanel = () => {
  const snapshot = useGraphStore((state) => state.snapshot);
  const isLoading = useGraphStore((state) => state.isLoading);
  const sessions = useSessionStore((state) => state.sessions);
  const [activeRoutePath, setActiveRoutePath] = useState<string | null>(null);

  // Extract route nodes from graph
  const routes = useMemo(() => {
    if (!snapshot) return [];

    const routeNodes = snapshot.nodes.filter(
      (node): node is GraphNode & { kind: 'route' } => node.kind === 'route'
    );

    return routeNodes.map(
      (node): RouteInfo => ({
        id: node.id,
        path: node.path,
        source: node.source ? `${node.source.filePath}:${node.source.line}` : undefined,
      })
    );
  }, [snapshot]);

  // Get active app session (first ready app session)
  const activeSession = sessions.find((s) => s.type === 'app' && s.state === 'ready');

  const handleRouteClick = (path: string) => {
    if (!activeSession) {
      console.warn('[RoutesPanel] No active app session');
      return;
    }

    // TODO: Implement navigation via IPC
    // For v0, just show the route path
    console.log('[RoutesPanel] Navigate to:', path);
    setActiveRoutePath(path);
  };

  // Empty state
  if (isLoading) {
    return (
      <div className="rounded-lg border border-line bg-bg-base p-6">
        <h2 className="mb-4 text-lg font-semibold text-fg-base">Routes</h2>
        <div className="flex items-center justify-center py-8 text-fg-muted">
          <span>Loading routes...</span>
        </div>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-bg-base p-6">
        <h2 className="mb-4 text-lg font-semibold text-fg-base">Routes</h2>
        <div className="flex flex-col items-center justify-center gap-2 py-8">
          <p className="text-fg-muted">No routes discovered</p>
          <p className="text-sm text-fg-muted">
            Configure a graph producer to populate routes from your router.
          </p>
        </div>
      </div>
    );
  }

  // No active session state
  if (!activeSession) {
    return (
      <div className="rounded-lg border border-line bg-bg-base p-6">
        <h2 className="mb-4 text-lg font-semibold text-fg-base">Routes</h2>
        <div className="flex flex-col gap-2">
          {routes.map((route) => (
            <div
              key={route.id}
              className="rounded-md border border-line bg-bg-muted px-3 py-2 opacity-50"
            >
              <div className="font-mono text-sm text-fg-base">{route.path}</div>
              {route.source && <div className="text-xs text-fg-muted">{route.source}</div>}
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-fg-muted">
          Start a preview session to enable navigation.
        </div>
      </div>
    );
  }

  // Routes list with navigation
  return (
    <div className="rounded-lg border border-line bg-bg-base p-6">
      <h2 className="mb-4 text-lg font-semibold text-fg-base">Routes</h2>
      <div className="flex flex-col gap-2">
        {routes.map((route) => {
          const isActive = activeRoutePath === route.path;

          return (
            <button
              key={route.id}
              onClick={() => handleRouteClick(route.path)}
              className={`group rounded-md border px-3 py-2 text-left transition-all ${
                isActive
                  ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950'
                  : 'border-line bg-bg-muted hover:border-line-hover hover:bg-bg-hover'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="font-mono text-sm text-fg-base">{route.path}</div>
                {isActive && (
                  <div className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    Active
                  </div>
                )}
              </div>
              {route.source && <div className="text-xs text-fg-muted">{route.source}</div>}
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-xs text-fg-muted">
        Click a route to navigate the preview session.
      </div>
    </div>
  );
};
