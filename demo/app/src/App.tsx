// ─────────────────────────────────────────────────────────────────────────────
// Demo App Root Component
// ─────────────────────────────────────────────────────────────────────────────
// This component contains the Router and all navigable UI.
//
// ARCHITECTURE:
// - App.tsx is the entry point for Skaffa previews (via preview.entry in skaffa.config.js)
// - App.tsx contains the Router so Skaffa can control navigation in previews
// - main.tsx (production) imports App.tsx and wraps with production-only providers
// - The harness (Skaffa preview) imports App.tsx and wraps with SkaffaProvider
//
// This separation means:
// - Production can add providers that would interfere with Skaffa (analytics, error boundaries, etc.)
// - Skaffa can preview the full routed app without production-only dependencies

import {
  createBrowserRouter,
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { routes } from "./routes";

// Create router instance
// Use BrowserRouter in production so standalone builds have URL-backed navigation.
// Keep MemoryRouter in dev/preview to avoid coupling Skaffa previews to browser history.
const router =
  import.meta.env.MODE === "production"
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
