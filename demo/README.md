# Skaffa Demo Workspace (v0)

> **Purpose:** Validates the complete v0 end-to-end journey for Skaffa's Integrated Design Environment

## What This Demonstrates

This demo workspace showcases all core v0 capabilities:

1. **Component Registry** - Type-level metadata for Inspector editing (demo + shadcn + layout)
2. **Runtime Adapter** - React adapter with click-to-select and override application
3. **Preview Sessions** - Running React app in preview with live updates
4. **Inspector Editing** - Edit component props with live preview updates
5. **Override Persistence** - Non-destructive overrides saved to `.skaffa/overrides.v0.json`
6. **Project Graph** - Routes and component types from graph producer
7. **Multi-route App** - Navigation and routed pages with a realistic UI surface

## Structure

```
demo/
├── package.json               # Workspace-only dev dependencies (extension modules)
├── skaffa.config.js           # Workspace configuration
├── vendor/                    # Packed extension modules + runtime packages (generated)
├── extensions/
│   └── demo-module/           # Component registry provider
│       ├── index.js           # Registry for demo.button and demo.card
│       └── package.json
├── app/                       # Sample React application
│   ├── src/
│   │   ├── main.tsx          # Production entry (no Skaffa deps)
│   │   ├── App.tsx           # Preview entry (router + UI)
│   │   ├── routes.tsx         # React Router routes
│   │   ├── data/
│   │   │   └── fixtures.ts    # Demo data
│   │   ├── components/
│   │   │   ├── AppShell.tsx   # Global layout + nav
│   │   │   └── ui/            # shadcn/ui components
│   │   └── pages/
│   │       ├── OverviewPage.tsx
│   │       ├── ModelsPage.tsx
│   │       ├── ModelDetailPage.tsx
│   │       ├── IncidentsPage.tsx
│   │       └── ExperimentsPage.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── index.html
└── .skaffa/                   # Workspace data
    └── overrides.v0.json      # Persisted overrides (created on first edit)
```

## Usage

### 1. Prepare Workspace Extensions

Build and pack the local extension modules, `@skaffa/config`, and layout
primitives, then install them into the demo workspace:

```bash
pnpm demo:refresh-extensions
```

### 2. Install Demo App Dependencies

```bash
pnpm -C demo/app install
```

If you ran `pnpm demo:refresh-extensions`, this is already done; re-run if
dependencies changed.

### 3. Start Skaffa

From the root of the Skaffa project:

```bash
pnpm dev
```

### 4. Open Demo Workspace

- In Skaffa (Launcher), use **Open Workspace**
- Navigate to and select the `demo/` directory
- Skaffa will load `skaffa.config.js` and activate modules

### 5. Start App Preview

- Click **"Start App Preview"** in the Preview panel
- The demo React app will load in the preview pane
- You should see the ModelOps console with navigation + routed pages

### 6. Select Component Instances

- **Click on any UI component** (Button, Card, Badge, Input, Select, Layout primitives)
- The Inspector panel will show the selected component's props
- Editable props appear with controls, inspect-only props show values

### 7. Edit Props in Inspector

- Change a button's **variant** or **size**
- Change a badge's **variant** or an input's **placeholder**
- Preview updates **immediately** (non-destructive override applied)
- Reset button appears to clear overrides

### 8. Verify Override Persistence

- Make some edits in the Inspector
- Close and reopen Skaffa
- Reopen the demo workspace
- Start app preview again
- **Overrides are preserved** from `demo/.skaffa/overrides.v0.json`

## Components

### ui.* (shadcn/ui registry)

Core components used by the demo app:
- `ui.button`
- `ui.card`
- `ui.input`
- `ui.select`
- `ui.checkbox`
- `ui.badge`
- `ui.dialog`

### layout.* (layout primitives registry)

Layout primitives used throughout the app:
- `layout.box`
- `layout.row`
- `layout.stack`

## Runtime Dependency Exception

The demo app intentionally depends on `@skaffa/layout-primitives-react` at runtime.
This is the one approved exception to the "no @skaffa/* runtime dependencies" rule.
In-repo, we install it from `demo/vendor` (local pack) to keep the workspace portable.
If you move the demo app outside this repo, replace the local tarball with a published
version of `@skaffa/layout-primitives-react`.
Component source references in the demo graph producer are workspace-relative
(`app/` and `node_modules/`) to keep the demo portable.

## Success Criteria

- ✅ Skaffa starts and opens demo workspace
- ✅ Demo module registers component registry
- ✅ Graph producer emits routes and component types
- ✅ App preview starts and shows React app
- ✅ Click-to-select works (clicking instances selects in Inspector)
- ✅ Inspector shows editable props with controls
- ✅ Editing props updates preview immediately
- ✅ Reset clears overrides and returns to baseline
- ✅ Overrides persist to `demo/.skaffa/overrides.v0.json`
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
- [Runtime Adapter Contract](../docs/skaffa_runtime_adapter_contract.md)
- [Component Registry Schema](../docs/skaffa_component_registry_schema.md)
- [Inspector UX Semantics](../docs/skaffa_inspector_ux_semantics.md)
- [Override Model](../docs/skaffa_override_model.md)
- [Preview Session Protocol](../docs/skaffa_preview_session_protocol.md)
