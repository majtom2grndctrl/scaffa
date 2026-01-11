Demo Workspace Walkthrough

  Let me walk you through testing the complete v0 journey! Here's the step-by-step process:

  🔧 Initial Setup (One-Time)

  1. Build Scaffa and Install Dependencies

  From the Scaffa root directory:

  pnpm install
  pnpm build

  This builds the Electron app, renderer, extension host, and React runtime adapter.

  2. Install Demo App Dependencies

  cd demo/app
  pnpm install
  cd ../..  # Back to root

  ---
  🚀 Running the Demo

  You'll need two terminal windows open:

  Terminal 1: Start the Demo React App

  cd demo/app
  pnpm dev

  You should see:
  VITE v5.x.x ready in xxx ms
  ➜ Local: http://localhost:5173/

  Keep this terminal running! This is the React app that Scaffa will preview.

  Terminal 2: Start Scaffa

  From the Scaffa root:

  pnpm dev

  The Scaffa Electron app should launch. You'll see the Workbench UI with empty panels.

  ---
  📂 Open the Demo Workspace

  1. In Scaffa, click File → Open Workspace (or use keyboard shortcut)
  2. Navigate to and select the demo/ folder
  3. Click Open

  What to expect:
  - Check the Electron DevTools console (Help → Toggle Developer Tools)
  - You should see:
  [DemoModule] Activating...
  [DemoModule] Contributed component registry for demo.button and demo.card
  [DemoGraphProducer] Activating...
  [DemoGraphProducer] Initialized with demo workspace data...

  ---
  🎬 Start App Preview Session

  1. In the Preview panel (or Web View panel), look for "Start App Preview" button
  2. Click it, and enter the URL: http://localhost:5173
  3. Click Start or OK

  What to expect:
  - The preview pane loads your React app
  - You should see:
    - "Scaffa Demo App" heading
    - Several colored cards with titles
    - Two buttons: "Increment" and "Reset"
    - An interactive counter

  ---
  🖱️ Test Click-to-Select

  1. Click on the blue "Increment" button in the preview
  2. Watch the Inspector panel on the right

  What to expect:
  - Inspector activates and shows:
    - Component: "Demo Button"
    - Props:
        - label (editable) - shows "Increment"
      - variant (editable dropdown) - shows "primary"
      - onClick (inspect-only) - shows function reference

  3. Now click on the "Welcome to Scaffa" card

  What to expect:
  - Inspector updates to show:
    - Component: "Demo Card"
    - Props:
        - title (editable) - "Welcome to Scaffa"
      - description (editable multiline) - the description text
      - variant (editable dropdown) - "primary"

  ---
  ✏️ Test Live Editing

  Edit a Button

  1. Select the "Increment" button (click on it in preview)
  2. In Inspector, find the label field
  3. Change it to "Count Up"
  4. Watch the preview update immediately! The button now says "Count Up"
  5. Change the variant dropdown to "danger"
  6. The button turns red immediately!

  Edit a Card

  1. Click on the "Welcome to Scaffa" card
  2. Change the title to "Testing Overrides"
  3. Card title updates live!
  4. Change variant to "accent"
  5. Card background turns yellow!

  ---
  🔄 Test Reset (Clear Overrides)

  1. With the button still selected (the one you renamed to "Count Up")
  2. Look for a Reset or Clear button next to the overridden props
  3. Click Reset on the label field
  4. The button reverts to "Increment" (original value from code)

  You can also:
  - Reset individual props
  - Reset all overrides for an instance
  - Reset all overrides for the session

  ---
  💾 Test Override Persistence

  Save Overrides

  1. Make several edits:
    - Change a button label
    - Change a card variant
    - Change another card title
  2. Check that the file was created:
  ls -la demo/.scaffa/

  You should see overrides.v0.json (might be created on first edit, or when you close).

  3. You can peek at the file:
  cat demo/.scaffa/overrides.v0.json

  You'll see JSON with your override values.

  Test Reload

  1. Close Scaffa completely (Cmd+Q or File → Quit)
  2. Restart Scaffa: pnpm dev
  3. Reopen the workspace: File → Open Workspace → Select demo/
  4. Start app preview again: http://localhost:5173
  5. Your overrides are restored! The preview shows your edited values, not the original code values

  ---
  ✅ Test Interactive Behavior

  Even with overrides applied, the app should still work:

  1. Click the "Count Up" button (or whatever you renamed it)
  2. The counter increments
  3. Click "Reset" button
  4. Counter resets to 0

  The onClick handlers still work! Overrides are non-destructive and don't break app functionality.

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
  ✅ Non-Destructive - Original code unchanged, app behavior preserved
  ✅ Persistence - Overrides save to disk and restore on reload

  ---
  🐛 Troubleshooting

  Demo app won't load in preview?
  - Make sure pnpm dev is running in demo/app/
  - Check the URL is http://localhost:5173 (or whatever Vite shows)

  Modules not activating?
  - Check Electron DevTools console for errors
  - Verify demo/scaffa.config.ts paths are correct

  Click-to-select not working?
  - Check preview console for adapter handshake messages
  - Verify ScaffaProvider is wrapping the app in demo/app/src/main.tsx

  Edits not updating preview?
  - Check that components use useScaffaInstance() hook
  - Check override messages in preview console

  ---
  Ready to start? Open those two terminals and let's validate Scaffa v0! 🚀
