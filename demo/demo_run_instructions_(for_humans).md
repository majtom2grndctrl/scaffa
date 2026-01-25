Demo Workspace Walkthrough

  Let me walk you through testing the complete v0 journey! Here's the step-by-step process:

  🔧 Initial Setup (One-Time)

  1. Build Scaffa and Install Dependencies

  From the Scaffa root directory:

  pnpm install
  pnpm build

  This builds the Electron app, renderer, extension host, and React runtime adapter.

  2. Pack Demo Workspace Extensions (and demo app deps)

  pnpm demo:refresh-extensions

  This packs local extension modules + layout primitives into demo/vendor and installs
  both demo/ and demo/app dependencies.

  ---
  🚀 Running the Demo

  Option A (Recommended): Managed Preview (single terminal)

  From the Scaffa root:

  pnpm dev

  The Scaffa Electron app should launch. When you start a session, the Vite launcher
  will start the demo app dev server automatically.

  Option B: Attach-by-URL (two terminals)

  Terminal 1: Start the Demo React App

  cd demo/app
  pnpm dev

  You should see:
  VITE v5.x.x ready in xxx ms
  ➜ Local: http://localhost:5173/

  Terminal 2: Start Scaffa

  From the Scaffa root:

  pnpm dev

  ---
  📂 Open the Demo Workspace (Launcher)

  1. In Scaffa, click Open Workspace
  2. Navigate to and select the demo/ folder
  3. Click Open

  What to expect:
  - Check the Electron DevTools console (Help → Toggle Developer Tools)
  - You should see:
  [DemoModule] Activating...
  [DemoModule] Contributed component registry for demo.button and demo.card
  [ReactRouterGraphProducer] Activating...
  [ReactRouterGraphProducer] Parsing route module: ...

  ---
  🎬 Start App Preview Session

  Managed preview:

  1. In the Preview panel, look for "Start Session" / "Start App Preview"
  2. Click it (no URL required)

  Attach-by-URL (fallback):

  1. Click "Start App Preview"
  2. Enter the URL shown by Vite (usually http://localhost:5173)
  3. Click Start or OK

  What to expect:
  - The preview pane loads the ModelOps console UI
  - You should see:
    - Left navigation (Overview, Models, Incidents, Experiments)
    - KPI cards and status panels on the Overview page
    - Search input + environment select in the header

  ---
  🖱️ Test Click-to-Select

  1. Click the "New experiment" button in the header
  2. Watch the Inspector panel on the right

  What to expect:
  - Inspector activates and shows:
    - Component: "Button"
    - Props:
      - variant (editable dropdown)
      - size (editable dropdown)
      - onClick (inspect-only)

  3. Now click the search input in the header

  What to expect:
  - Inspector updates to show:
    - Component: "Input"
    - Props:
      - placeholder (editable)
      - type (editable dropdown)

  ---
  ✏️ Test Live Editing

  Edit a Button

  1. Select the "New experiment" button (click on it in preview)
  2. In Inspector, change the variant to "outline"
  3. The button updates immediately

  Edit an Input

  1. Click the search input
  2. Change the placeholder text
  3. The placeholder updates immediately

  ---
  🔄 Test Reset (Clear Overrides)

  1. With the button still selected (the one you changed to "outline")
  2. Look for a Reset or Clear button next to the overridden props
  3. Click Reset on the variant field
  4. The button reverts to its original styling

  You can also:
  - Reset individual props
  - Reset all overrides for an instance
  - Reset all overrides for the session

  ---
  💾 Test Override Persistence

  Save Overrides

  1. Make several edits:
    - Change a button variant
    - Change an input placeholder
    - Change a badge variant
  2. Check that the file was created:
  ls -la demo/.scaffa/

  You should see overrides.v0.json (might be created on first edit, or when you close).

  3. You can peek at the file:
  cat demo/.scaffa/overrides.v0.json

  You'll see JSON with your override values.

  Test Reload

  1. Close Scaffa completely (Cmd+Q or File → Quit)
  2. Restart Scaffa: pnpm dev
  3. Reopen the workspace: Open Workspace → Select demo/
  4. Start app preview again (managed or attach-by-URL)
  5. Your overrides are restored! The preview shows your edited values, not the original code values

  ---
  ✅ Interaction Policy Check

  Editor View consumes clicks for selection. It's expected that app interactions
  (navigation, button handlers) do not fire in the editor session.

  ---
  🎯 What You've Validated

  By completing these steps, you've proven:

  ✅ Workspace Loading - Modules activate and contribute registries
  ✅ Component Registry - Type-level metadata powers the Inspector
  ✅ Project Graph - Routes and component types are tracked
  ✅ Preview Sessions - React app runs in preview with runtime adapter
  ✅ Click-to-Select - Instance identification from DOM clicks
  ✅ Inspector UI - Editable and inspect-only props render correctly
  ✅ Live Updates - Overrides apply immediately without code changes
  ✅ Non-Destructive - Original code unchanged
  ✅ Persistence - Overrides save to disk and restore on reload

  ---
  🐛 Troubleshooting

  Demo app won't load in preview?
  - Managed preview: check the Scaffa logs for Vite launcher errors
  - Attach-by-URL: make sure pnpm dev is running in demo/app/
  - Check the URL is http://localhost:5173 (or whatever Vite shows)

  Modules not activating?
  - Check Electron DevTools console for errors
  - Verify demo/scaffa.config.js package entries (including @scaffa/config) are installed in demo/node_modules
  - Run pnpm demo:refresh-extensions to rebuild demo/vendor tarballs

  Click-to-select not working?
  - Check preview console for adapter handshake messages
  - In managed preview, confirm logs like:
    [ViteRunner] Serving virtual harness module
    [ViteRunner] Instrumenting: .../src/components/ui/button.tsx

  Edits not updating preview?
  - Confirm the session is managed (instrumentation is only injected there)
  - Ensure registry entries include implementation hints (file path + export name)
  - Check override messages in preview console

  ---
  Ready to start? Open those two terminals and let's validate Scaffa v0! 🚀
