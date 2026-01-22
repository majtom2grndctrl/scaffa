// ─────────────────────────────────────────────────────────────────────────────
// Demo App Route Definitions (React Router data-router API)
// ─────────────────────────────────────────────────────────────────────────────
// This file defines routes using React Router's data-router (object) API.
// Scaffa will statically parse this file to populate the Project Graph.

import type { RouteObject } from 'react-router-dom';
import React from 'react';
import { HomePage } from './pages/HomePage';

/**
 * Canonical route definitions for Scaffa-enabled demo app.
 *
 * IMPORTANT: Each route MUST have a stable `id` for Scaffa to:
 * - Join graph route nodes with runtime router state
 * - Highlight the active route in the Routes panel
 * - Enable route-based navigation
 */
export const routes: RouteObject[] = [
  {
    id: 'home',
    path: '/',
    element: <HomePage />,
  },
  // Add more routes here as the app grows
  // {
  //   id: 'about',
  //   path: '/about',
  //   element: <AboutPage />,
  // },
];
