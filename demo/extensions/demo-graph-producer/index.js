// ─────────────────────────────────────────────────────────────────────────────
// Demo Graph Producer Module (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Provides graph snapshot with component types for the demo workspace.

import { createComponentTypeNode } from "../../../extension-sdk.js";

export function activate(context) {
  console.log("[DemoGraphProducer] Activating...");

  const componentTypes = [
    {
      id: "ui.button",
      displayName: "Button",
      filePath: "app/src/components/ui/button.tsx",
      line: 1,
    },
    {
      id: "ui.card",
      displayName: "Card",
      filePath: "app/src/components/ui/card.tsx",
      line: 1,
    },
    {
      id: "ui.input",
      displayName: "Input",
      filePath: "app/src/components/ui/input.tsx",
      line: 1,
    },
    {
      id: "ui.checkbox",
      displayName: "Checkbox",
      filePath: "app/src/components/ui/checkbox.tsx",
      line: 1,
    },
    {
      id: "ui.select",
      displayName: "Select",
      filePath: "app/src/components/ui/select.tsx",
      line: 1,
    },
    {
      id: "ui.badge",
      displayName: "Badge",
      filePath: "app/src/components/ui/badge.tsx",
      line: 1,
    },
    {
      id: "ui.dialog",
      displayName: "Dialog",
      filePath: "app/src/components/ui/dialog.tsx",
      line: 1,
    },
    {
      id: "layout.box",
      displayName: "Box",
      filePath:
        "app/node_modules/@skaffa/layout-primitives-react/dist/index.js",
      line: 1,
    },
    {
      id: "layout.row",
      displayName: "Row",
      filePath:
        "app/node_modules/@skaffa/layout-primitives-react/dist/index.js",
      line: 1,
    },
    {
      id: "layout.stack",
      displayName: "Stack",
      filePath:
        "app/node_modules/@skaffa/layout-primitives-react/dist/index.js",
      line: 1,
    },
  ];

  const producer = {
    id: "demo-graph-producer",

    async initialize() {
      console.log(
        "[DemoGraphProducer] Initializing with demo workspace data...",
      );

      // Return initial graph snapshot with demo component types only.
      return {
        schemaVersion: "v0",
        revision: 1,
        nodes: [
          // Component types used in the demo app
          ...componentTypes.map((entry) => createComponentTypeNode(entry)),
        ],
        edges: [],
      };
    },

    start(onPatch) {
      console.log("[DemoGraphProducer] Starting patch emission...");

      // For demo purposes, we can emit patches later if needed
      // For now, just provide initial snapshot

      return {
        dispose: () => {
          console.log("[DemoGraphProducer] Stopped");
        },
      };
    },
  };

  context.graph.registerProducer(producer);
  console.log("[DemoGraphProducer] Activated");
}

export function deactivate() {
  console.log("[DemoGraphProducer] Deactivated");
}
