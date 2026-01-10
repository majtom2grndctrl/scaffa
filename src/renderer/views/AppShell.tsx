import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import type { PropsWithChildren } from 'react';

export const AppShell = ({ children }: PropsWithChildren) => {
  const showDevtools = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-surface-0 text-fg">
      <header className="border-b border-subtle px-6 py-4">
        <h1 className="text-lg font-semibold">Scaffa Workbench</h1>
        <p className="text-sm text-fg-muted">
          Instance-first editing sandbox aligned to docs/index.md.
        </p>
      </header>
      <main className="px-6 py-6">{children}</main>
      {showDevtools ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      {showDevtools ? <TanStackRouterDevtools /> : null}
    </div>
  );
};
