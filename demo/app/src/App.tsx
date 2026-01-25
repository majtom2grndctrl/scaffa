// ─────────────────────────────────────────────────────────────────────────────
// Demo App Root Component
// ─────────────────────────────────────────────────────────────────────────────
// This component contains the Router and all navigable UI.
// 
// ARCHITECTURE:
// - App.tsx is the entry point for Scaffa previews (via preview.entry in scaffa.config.js)
// - App.tsx contains the Router so Scaffa can control navigation in previews
// - main.tsx (production) imports App.tsx and wraps with production-only providers
// - The harness (Scaffa preview) imports App.tsx and wraps with ScaffaProvider
//
// This separation means:
// - Production can add providers that would interfere with Scaffa (analytics, error boundaries, etc.)
// - Scaffa can preview the full routed app without production-only dependencies

import { createBrowserRouter, createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

// Create router instance
// Use BrowserRouter in production so standalone builds have URL-backed navigation.
// Keep MemoryRouter in dev/preview to avoid coupling Scaffa previews to browser history.
const router =
  import.meta.env.MODE === 'production'
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
