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

import React from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

// Create router instance
// Using MemoryRouter for compatibility with both production (main.tsx) and Scaffa preview (harness)
// In production, main.tsx could swap this for createBrowserRouter if needed
const router = createMemoryRouter(routes);

export function App() {
  return <RouterProvider router={router} />;
}
