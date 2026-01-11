# Demo Workspace Testing Checklist

> **Goal:** Validate the complete v0 end-to-end journey using the demo workspace

## Pre-Test Setup

### 1. Build Scaffa

From the root of the Scaffa project:

```bash
pnpm install
pnpm build
```

### 2. Start Demo App Dev Server

In a separate terminal, start the demo app:

```bash
cd demo/app
pnpm install
pnpm dev
```

The app should start on `http://localhost:5173` (or similar port).

**Keep this terminal running** - Scaffa will preview this URL.

### 3. Start Scaffa

In another terminal, from the Scaffa root:

```bash
pnpm dev
```

Scaffa Workbench should launch in Electron.

---

## Test Checklist

### Phase 1: Workspace Loading

- [ ] **Open Demo Workspace**
  - In Scaffa, click **File → Open Workspace**
  - Navigate to the `demo/` directory
  - Select it to open the workspace

- [ ] **Verify Module Activation**
  - Check Electron DevTools console (Help → Toggle Developer Tools)
  - Should see:
    ```
    [DemoModule] Activating...
    [DemoModule] Contributed component registry for demo.button and demo.card
    [DemoModule] Activated
    [DemoGraphProducer] Activating...
    [DemoGraphProducer] Initialized with demo workspace data...
    [DemoGraphProducer] Activated
    ```

- [ ] **Verify Component Registry Loaded**
  - Check the Component Registry panel
  - Should show `demo.button` and `demo.card` entries
  - Click on each to see their prop metadata

- [ ] **Verify Project Graph Populated**
  - Check the Project Graph panel
  - Should show:
    - Route: `/`
    - Component Type: `demo.button`
    - Component Type: `demo.card`
    - Edges showing route uses these components

---

### Phase 2: Preview Session

- [ ] **Start App Preview**
  - In the Preview panel, click **"Start App Preview"**
  - Or use **Preview → Start App Session**
  - Enter URL: `http://localhost:5173` (where demo app is running)

- [ ] **Verify Preview Loads**
  - Preview pane should show the demo React app
  - Should see:
    - "Scaffa Demo App" heading
    - Multiple cards (Welcome, Interactive Counter, Try Override)
    - Two buttons (Increment, Reset)

- [ ] **Verify Runtime Adapter Handshake**
  - Check browser console in the preview WebView
  - Should see:
    ```
    [ScaffaAdapter] Initializing...
    [ScaffaAdapter] Runtime ready, sending handshake
    ```

---

### Phase 3: Click-to-Select

- [ ] **Select Button Instance**
  - Click on the "Increment" button in the preview
  - Inspector panel should activate and show:
    - Component: `Demo Button`
    - Props: `label`, `variant`, `onClick`

- [ ] **Select Card Instance**
  - Click on the "Welcome to Scaffa" card in the preview
  - Inspector should show:
    - Component: `Demo Card`
    - Props: `title`, `description`, `variant`

- [ ] **Verify Prop Values**
  - Editable props should show controls (text input, dropdown)
  - Inspect-only props (like `onClick`) should show value but no edit control

---

### Phase 4: Inspector Editing

- [ ] **Edit Button Label**
  - Select the "Increment" button
  - In Inspector, change `label` to "Count Up"
  - Preview should **immediately** update to show "Count Up"

- [ ] **Edit Button Variant**
  - With button selected, change `variant` dropdown to "danger"
  - Button should turn red immediately

- [ ] **Edit Card Title**
  - Select the "Welcome to Scaffa" card
  - Change `title` to "Testing Overrides"
  - Card title should update immediately

- [ ] **Edit Card Variant**
  - Change card `variant` to "accent"
  - Card background should turn yellow

- [ ] **Verify Override Indicator**
  - Overridden props should show an indicator (badge, highlight, or reset button)
  - "Reset" button should appear next to overridden values

---

### Phase 5: Override Reset

- [ ] **Reset Single Override**
  - With an overridden prop selected, click **Reset**
  - Value should revert to original from code
  - Preview should update to show original value

- [ ] **Reset Instance Overrides**
  - Click **"Reset All"** for an instance
  - All overrides for that instance should clear
  - Preview should return to baseline

---

### Phase 6: Override Persistence

- [ ] **Make Multiple Overrides**
  - Override at least 3 props across button and card instances
  - Note the values you set

- [ ] **Verify Persistence File Created**
  - Check `demo/.scaffa/overrides.v0.json`
  - File should exist and contain your overrides in JSON format

- [ ] **Reload Scaffa**
  - Close Scaffa
  - Restart with `pnpm dev`
  - Reopen demo workspace
  - Start app preview again

- [ ] **Verify Overrides Restored**
  - Preview should show overridden values (not baseline)
  - Inspector should show override indicators
  - The overrides persisted across sessions ✅

---

### Phase 7: Functional Behavior

- [ ] **Verify App Interactivity Still Works**
  - Click "Increment" button (or your renamed version)
  - Counter should increment
  - onClick handlers should still fire normally

- [ ] **Verify Multiple Instances**
  - Edit the "Reset" button label separately from "Increment"
  - Each instance should maintain its own override state
  - Selecting each should show different values in Inspector

---

## Success Criteria Summary

All of the following must work:

✅ Scaffa opens demo workspace
✅ Demo modules activate (registry + graph producer)
✅ Component registry shows `demo.button` and `demo.card`
✅ Graph shows routes and component types
✅ App preview session starts and loads React app
✅ Click-to-select identifies component instances
✅ Inspector displays editable and inspect-only props
✅ Editing props updates preview immediately (non-destructive)
✅ Reset clears overrides and returns to baseline
✅ Overrides persist to `demo/.scaffa/overrides.v0.json`
✅ Reopening workspace restores overrides from disk
✅ App functionality (onClick handlers) still works with overrides

---

## Troubleshooting

### Demo App Won't Load in Preview

- **Check:** Is `pnpm dev` running in `demo/app`?
- **Check:** Is the URL correct? Default is `http://localhost:5173`
- **Check:** Can you open the URL in a regular browser?

### Modules Not Activating

- **Check:** Console logs in Electron DevTools
- **Check:** `demo/scaffa.config.ts` paths are correct (relative to demo/)
- **Check:** TypeScript compilation errors in extension files

### Click-to-Select Not Working

- **Check:** Runtime adapter handshake in preview console
- **Check:** `ScaffaProvider` is wrapping the React app in `demo/app/src/main.tsx`
- **Check:** Components use `ScaffaInstance` wrapper

### Overrides Not Applying

- **Check:** Components use `useScaffaInstance()` hook to apply overrides
- **Check:** Runtime adapter receiving override messages (check preview console)
- **Check:** Override store is being updated (check main process logs)

### Overrides Not Persisting

- **Check:** `demo/.scaffa/` directory exists and is writable
- **Check:** Override store is configured to persist to this path
- **Check:** File is written after making changes (check file timestamp)

---

## Next Steps After Validation

Once all tests pass:

1. Document any issues or edge cases discovered
2. Create additional test cases for complex scenarios
3. Test with more component types
4. Validate component session previews (isolated harness)
5. Test orphaned override handling
6. Begin integration with Iteration Deck (future)
