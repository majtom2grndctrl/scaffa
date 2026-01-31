import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useInspectorStore } from '../state/inspectorStore';
import { useSessionStore } from '../state/sessionStore';
import { useWorkspaceStore } from '../state/workspaceStore';
import { ConfigHealthBanner } from '../components/ConfigHealthBanner';

export const AppShell = () => {
  const showDevtools = import.meta.env.DEV;
  const initializeGraph = useGraphStore((state) => state.initialize);
  const resetGraph = useGraphStore((state) => state.reset);
  const initializeInspector = useInspectorStore((state) => state.initialize);
  const resetInspector = useInspectorStore((state) => state.reset);
  const resetSessions = useSessionStore((state) => state.reset);
  const initializeWorkspace = useWorkspaceStore((state) => state.initialize);
  const currentWorkspace = useWorkspaceStore((state) => state.currentWorkspace);
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const previousWorkspacePath = useRef<string | null>(null);

  // Initialize workspace store on mount
  useEffect(() => {
    void initializeWorkspace();
  }, [initializeWorkspace]);

  // Initialize or reset stores based on workspace
  useEffect(() => {
    if (currentWorkspace) {
      if (
        previousWorkspacePath.current &&
        previousWorkspacePath.current !== currentWorkspace.path
      ) {
        resetGraph();
        resetInspector();
        resetSessions();
      }

      previousWorkspacePath.current = currentWorkspace.path;
      void initializeGraph();
      void initializeInspector();
    } else {
      resetGraph();
      resetInspector();
      resetSessions();
      previousWorkspacePath.current = null;
    }
  }, [
    currentWorkspace?.path,
    initializeGraph,
    initializeInspector,
    resetGraph,
    resetInspector,
    resetSessions,
  ]);

  // Route based on workspace state
  useEffect(() => {
    if (currentWorkspace && pathname === '/') {
      void navigate({ to: '/workbench', replace: true });
    }

    if (!currentWorkspace && pathname !== '/') {
      void navigate({ to: '/', replace: true });
    }
  }, [currentWorkspace, navigate, pathname]);

  return (
    <div className="flex h-screen flex-col bg-surface-app text-fg">
      <header className="border-b border-subtle px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold text-fg">Skaffa</h1>
            <p className="text-sm text-fg-muted">
              {currentWorkspace
                ? `Workspace: ${currentWorkspace.name}`
                : 'Launcher · Choose a workspace to begin.'}
            </p>
          </div>
          {currentWorkspace ? (
            <div className="max-w-full truncate text-xs text-fg-subtle">
              <span className="font-mono">{currentWorkspace.path}</span>
            </div>
          ) : null}
        </div>
      </header>
      {currentWorkspace ? <ConfigHealthBanner /> : null}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      {showDevtools ? <TanStackRouterDevtools /> : null}
    </div>
  );
};
