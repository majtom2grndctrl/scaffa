import { createRouter, RootRoute, Route } from '@tanstack/react-router';
import { AppShell } from './views/AppShell';
import { Workbench } from './views/Workbench';

const rootRoute = new RootRoute({
  component: AppShell,
});

const indexRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Workbench,
});

const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
