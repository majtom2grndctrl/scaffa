# Scaffa Demo Workspace (v0)

> **Purpose:** Validates the complete v0 end-to-end journey for Scaffa's Integrated Design Environment

## What This Demonstrates

This demo workspace showcases all core v0 capabilities:

1. **Component Registry** - Type-level metadata for Inspector editing
2. **Runtime Adapter** - React adapter with click-to-select and override application
3. **Preview Sessions** - Running React app in preview with live updates
4. **Inspector Editing** - Edit component props with live preview updates
5. **Override Persistence** - Non-destructive overrides saved to `.scaffa/overrides.v0.json`
6. **Project Graph** - Routes and component types from graph producer

## Structure

```
demo/
├── scaffa.config.js           # Workspace configuration
├── extensions/
│   └── demo-module/           # Component registry provider
│       ├── index.ts           # Registry for demo.button and demo.card
│       └── package.json
├── app/                       # Sample React application
│   ├── src/
│   │   ├── main.tsx          # Production entry (no Scaffa deps)
│   │   ├── App.tsx           # Preview entry (router + UI)
│   │   └── components/
│   │       ├── DemoButton.tsx
│   │       └── DemoCard.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── .scaffa/                   # Workspace data
    └── overrides.v0.json      # Persisted overrides (created on first edit)
```

## Usage

### 1. Start Scaffa

From the root of the Scaffa project:

```bash
pnpm dev
```

### 2. Open Demo Workspace

- In Scaffa (Launcher), use **Open Workspace**
- Navigate to and select the `demo/` directory
- Scaffa will load `scaffa.config.js` and activate modules

### 3. Start App Preview

- Click **"Start App Preview"** in the Preview panel
- The demo React app will load in the preview pane
- You should see buttons and cards rendered

### 4. Select Component Instances

- **Click on any button or card** in the preview
- The Inspector panel will show the selected component's props
- Editable props appear with controls, inspect-only props show values

### 5. Edit Props in Inspector

- Change a button's **label** or **variant**
- Change a card's **title** or **variant**
- Preview updates **immediately** (non-destructive override applied)
- Reset button appears to clear overrides

### 6. Verify Override Persistence

- Make some edits in the Inspector
- Close and reopen Scaffa
- Reopen the demo workspace
- Start app preview again
- **Overrides are preserved** from `demo/.scaffa/overrides.v0.json`

## Components

### demo.button

**Editable Props:**
- `label` (string) - Button text
- `variant` (select: primary, secondary, danger) - Visual style

**Inspect-Only Props:**
- `onClick` (function) - Click handler

### demo.card

**Editable Props:**
- `title` (string) - Card title
- `description` (string, multiline) - Card description
- `variant` (select: primary, secondary, accent) - Visual style

## Success Criteria

- ✅ Scaffa starts and opens demo workspace
- ✅ Demo module registers component registry
- ✅ Graph producer emits routes and component types
- ✅ App preview starts and shows React app
- ✅ Click-to-select works (clicking instances selects in Inspector)
- ✅ Inspector shows editable props with controls
- ✅ Editing props updates preview immediately
- ✅ Reset clears overrides and returns to baseline
- ✅ Overrides persist to `demo/.scaffa/overrides.v0.json`
- ✅ Reopening workspace restores overrides

## Next Steps

After validating the v0 journey:

1. Test with more complex components
2. Add additional component types to registry
3. Explore component session previews (isolated component harness)
4. Test override edge cases (orphaned overrides, conflicts)
5. Integrate with Iteration Deck (future)

## Architecture References

See `/docs` for detailed contracts:
- [Runtime Adapter Contract](../docs/scaffa_runtime_adapter_contract.md)
- [Component Registry Schema](../docs/scaffa_component_registry_schema.md)
- [Inspector UX Semantics](../docs/scaffa_inspector_ux_semantics.md)
- [Override Model](../docs/scaffa_override_model.md)
- [Preview Session Protocol](../docs/scaffa_preview_session_protocol.md)
