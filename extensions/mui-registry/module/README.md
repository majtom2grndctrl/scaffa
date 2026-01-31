# MUI Registry Module

A Skaffa registry module that provides component metadata for [Material UI](https://mui.com/material-ui/) (`@mui/material`) components.

## Components

This module registers the following MUI components:

| Component | Type ID | Description |
|-----------|---------|-------------|
| Button | `mui.button` | Interactive button for user actions |
| TextField | `mui.textField` | Text input field with validation support |
| Select | `mui.select` | Dropdown for selecting from options |
| Checkbox | `mui.checkbox` | Boolean toggle checkbox |
| Card | `mui.card` | Container surface for grouped content |
| Typography | `mui.typography` | Styled text rendering |

## Usage

Add the module to your `skaffa.config.js`:

```js
// skaffa.config.js
export default {
  modules: [
    // ... other modules
    './modules/mui-registry/index.js',
  ],
};
```

## Implementation Hints

Each component includes a `ComponentImplementationHint` with `kind: 'package'` specifying the `@mui/material/*` import path. This enables registry-driven instrumentation in managed preview sessions.

For example:
- `@mui/material/Button` → `mui.button`
- `@mui/material/TextField` → `mui.textField`

## Extending the Registry

To add more MUI components or customize existing entries, you can:

1. **Contribute additional components** in a downstream module
2. **Override props** via project configuration in `skaffa.config.js`:

```js
// skaffa.config.js
export default {
  modules: ['./modules/mui-registry/index.js'],
  registry: {
    overrides: {
      'mui.button': {
        props: {
          variant: {
            exposure: {
              uiDefaultValue: 'contained', // Change default
            },
          },
        },
      },
    },
  },
};
```

## Notes

- All handler props (`onClick`, `onChange`, etc.) are marked as `inspectOnly` since they cannot be safely edited in the Inspector.
- The `children` prop uses a `slot` control that displays content but does not support inline editing in v0.
- Color props use the MUI palette values (`primary`, `secondary`, `error`, etc.)
- **Intentional omissions for v0:**
  - `sx` prop: Complex styling object not editable in v0 Inspector
  - `component` prop: Polymorphic component prop requires type-safe handling not yet supported
  - `value`/`defaultValue` props: Controlled component state managed by application code

## Related Documentation

- [Skaffa Component Registry Schema](../../docs/skaffa_component_registry_schema.md)
- [Skaffa Extension Authoring Guide](../../docs/skaffa_extension_authoring_guide.md)
