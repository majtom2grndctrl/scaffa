import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { Outlet } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useGraphStore } from '../state/graphStore';
import { useInspectorStore } from '../state/inspectorStore';
import { ConfigHealthBanner } from '../components/ConfigHealthBanner';

export const AppShell = () => {
  const showDevtools = import.meta.env.DEV;
  const initializeGraph = useGraphStore((state) => state.initialize);
  const initializeInspector = useInspectorStore((state) => state.initialize);

  // Initialize stores on mount
  useEffect(() => {
    initializeGraph();
    initializeInspector();
  }, [initializeGraph, initializeInspector]);

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
      <header className="border-b border-subtle px-6 py-4">
        <h1 className="text-lg font-semibold">Scaffa Workbench</h1>
        <p className="text-sm text-fg-muted">
          Instance-first editing sandbox aligned to docs/index.md.
        </p>
      </header>
      <ConfigHealthBanner />
      <main className="px-6 py-6">
        <Outlet />
      </main>
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      {showDevtools ? <TanStackRouterDevtools /> : null}
    </div>
  );
};
