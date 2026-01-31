# shadcn/ui Registry Module

Component registry for [shadcn/ui](https://ui.shadcn.com/) components.

## Components Included

- **Button** (`ui.button`) - User actions and navigation
- **Card** (`ui.card`) - Content grouping surface
- **Input** (`ui.input`) - Text input field
- **Checkbox** (`ui.checkbox`) - Boolean selection
- **Select** (`ui.select`) - Dropdown selection
- **Badge** (`ui.badge`) - Status, labels, or counts
- **Dialog** (`ui.dialog`) - Modal dialogs and overlays

## TypeId Namespace: `ui.*`

**Rationale:** shadcn/ui components are typically part of the project's "ui" layer, living in `src/components/ui/`. The `ui.*` namespace is:
- **Short and clear** - Easy to type and read
- **Framework-agnostic** - Unlike `shadcn.*`, doesn't imply runtime dependency
- **Conventional** - Aligns with the standard shadcn file structure

## Usage

### Enable the Module

In your `skaffa.config.js`:

```js
export default {
  modules: [
    // Enable the shadcn/ui registry
    { id: 'shadcn-ui-registry', package: '@skaffa/shadcn-ui-registry' },
  ],
};
```

### Implementation Hints

This registry uses `kind: "file"` implementation hints pointing to the conventional shadcn layout.
If `app/src/components/ui` exists (Skaffa demo structure), it uses that; otherwise it falls back to
`src/components/ui`:

```
src/components/ui/
  button.tsx
  card.tsx
  input.tsx
  checkbox.tsx
  select.tsx
  badge.tsx
  dialog.tsx
```

If your project uses a different structure, override the file paths in your project config (see below).

**Important:** This registry assumes shadcn/ui components are **workspace-local files** (installed via `npx shadcn add`), not npm package imports. If you were to use components directly from `@radix-ui/*` or a future `shadcn` npm package, you would need to override the registry with `kind: "package"` implementation hints.

### Project Overrides

You can customize registry entries in `skaffa.config.js`.

**Note:** The override syntax shown below is illustrative and represents the intended v0 API. The exact `skaffa.config.js` structure is pending finalization.

#### Example: Change File Paths

```js
export default {
  modules: [{ id: 'shadcn-ui-registry', package: '@skaffa/shadcn-ui-registry' }],

  registry: {
    overrides: {
      'ui.button': {
        // Override implementation hint to point to a custom location
        implementation: {
          kind: 'file',
          filePath: 'components/custom/button.tsx',
          exportName: 'CustomButton',
        },
      },
    },
  },
};
```

#### Example: Make a Prop Inspect-Only

```js
export default {
  modules: [{ id: 'shadcn-ui-registry', package: '@skaffa/shadcn-ui-registry' }],

  registry: {
    overrides: {
      'ui.button': {
        props: {
          variant: {
            // Change variant from editable to inspect-only
            exposure: { kind: 'inspectOnly', displayHint: 'summary' },
          },
        },
      },
    },
  },
};
```

#### Example: Disable a Component

```js
export default {
  modules: [{ id: 'shadcn-ui-registry', package: '@skaffa/shadcn-ui-registry' }],

  registry: {
    overrides: {
      'ui.dialog': {
        // Hide Dialog from Inspector (prevent overrides)
        disabled: true,
      },
    },
  },
};
```

## Adding shadcn/ui Components to Your Project

This registry provides metadata only. To add actual shadcn/ui components to your project, use the shadcn CLI:

```bash
npx shadcn@latest add button card input checkbox select badge dialog
```

The registry's `implementation` hints assume the standard shadcn file layout. If you customize component locations, remember to override the registry entries accordingly.

## Extending the Registry

This module includes a starter set of core components. To add more shadcn/ui components (e.g., Tabs, Accordion, DropdownMenu):

1. **Option A:** Fork this module and add additional entries to the `components` object
2. **Option B:** Create a project-local registry contribution in your `skaffa.config.js`

See `docs/skaffa_component_registry_schema.md` for the full registry schema.
