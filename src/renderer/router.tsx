import { createRouter, RootRoute, Route } from '@tanstack/react-router';
import { AppShell } from './views/AppShell';
import { Launcher } from './views/Launcher';
import { Workbench } from './views/Workbench';

const rootRoute = new RootRoute({
  component: AppShell,
});

const launcherRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Launcher,
});

const workbenchRoute = new Route({
  getParentRoute: () => rootRoute,
  path: '/workbench',
  component: Workbench,
});

const routeTree = rootRoute.addChildren([launcherRoute, workbenchRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
