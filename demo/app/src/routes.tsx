// ─────────────────────────────────────────────────────────────────────────────
// Demo App Route Definitions (React Router data-router API)
// ─────────────────────────────────────────────────────────────────────────────
// This file defines routes using React Router's data-router (object) API.
// Skaffa will statically parse this file to populate the Project Graph.

import type { RouteObject } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ExperimentsPage } from "./pages/ExperimentsPage";
import { IncidentsPage } from "./pages/IncidentsPage";
import { ModelDetailPage } from "./pages/ModelDetailPage";
import { ModelsPage } from "./pages/ModelsPage";
import { OverviewPage } from "./pages/OverviewPage";

/**
 * Canonical route definitions for Skaffa-enabled demo app.
 *
 * IMPORTANT: Each route MUST have a stable `id` for Skaffa to:
 * - Join graph route nodes with runtime router state
 * - Highlight the active route in the Routes panel
 * - Enable route-based navigation
 */
export const routes: RouteObject[] = [
  {
    id: "root",
    path: "/",
    element: <AppShell />,
    children: [
      {
        id: "overview",
        path: "",
        element: <OverviewPage />,
      },
      {
        id: "models",
        path: "models",
        element: <ModelsPage />,
      },
      {
        id: "model-detail",
        path: "models/:modelId",
        element: <ModelDetailPage />,
      },
      {
        id: "incidents",
        path: "incidents",
        element: <IncidentsPage />,
      },
      {
        id: "experiments",
        path: "experiments",
        element: <ExperimentsPage />,
      },
    ],
  },
];
