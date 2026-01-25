// ─────────────────────────────────────────────────────────────────────────────
// MUI Registry Module (v0) - Component Registry Provider
// ─────────────────────────────────────────────────────────────────────────────
// Provides component registry metadata for Material UI (@mui/material) components.
// See: docs/scaffa_component_registry_schema.md

export function activate(context) {
  console.log('[MUIRegistry] Activating...');

  const registry = {
    schemaVersion: 'v0',
    components: {
      // ─────────────────────────────────────────────────────────────────────
      // Button
      // ─────────────────────────────────────────────────────────────────────
      'mui.button': {
        typeId: 'mui.button',
        displayName: 'Button',
        tags: ['mui', 'button', 'interactive', 'input'],
        description: 'Material UI Button component for user actions and navigation',
        props: {
          variant: {
            propName: 'variant',
            label: 'Variant',
            description: 'The visual style variant of the button',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'text', label: 'Text', description: 'Minimal text-only style' },
                  { value: 'contained', label: 'Contained', description: 'Filled button with elevation' },
                  { value: 'outlined', label: 'Outlined', description: 'Border-only style' },
                ],
              },
              uiDefaultValue: 'text',
            },
          },
          color: {
            propName: 'color',
            label: 'Color',
            description: 'The color palette of the button',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'inherit', label: 'Inherit' },
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'success', label: 'Success' },
                  { value: 'error', label: 'Error' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                ],
              },
              uiDefaultValue: 'primary',
            },
          },
          size: {
            propName: 'size',
            label: 'Size',
            description: 'The size of the button',
            group: 'Appearance',
            order: 30,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'large', label: 'Large' },
                ],
              },
              uiDefaultValue: 'medium',
            },
          },
          disabled: {
            propName: 'disabled',
            label: 'Disabled',
            description: 'If true, the button is disabled',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          fullWidth: {
            propName: 'fullWidth',
            label: 'Full Width',
            description: 'If true, the button stretches to full container width',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          disableElevation: {
            propName: 'disableElevation',
            label: 'Disable Elevation',
            description: 'If true, no elevation is applied (contained variant)',
            group: 'Appearance',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          href: {
            propName: 'href',
            label: 'Link URL',
            description: 'The URL to link to when the button is clicked',
            group: 'Behavior',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'https://example.com',
              },
            },
          },
          onClick: {
            propName: 'onClick',
            label: 'onClick',
            description: 'Click handler function',
            group: 'Behavior',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'code',
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Button content (typically text or icons)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/Button',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // TextField
      // ─────────────────────────────────────────────────────────────────────
      'mui.textField': {
        typeId: 'mui.textField',
        displayName: 'Text Field',
        tags: ['mui', 'input', 'form', 'text'],
        description: 'Material UI TextField for text input with optional validation',
        props: {
          variant: {
            propName: 'variant',
            label: 'Variant',
            description: 'The visual style variant of the text field',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'outlined', label: 'Outlined', description: 'Border around the input' },
                  { value: 'filled', label: 'Filled', description: 'Filled background style' },
                  { value: 'standard', label: 'Standard', description: 'Underline-only style' },
                ],
              },
              uiDefaultValue: 'outlined',
            },
          },
          label: {
            propName: 'label',
            label: 'Label',
            description: 'The label text displayed above or inside the input',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'Field label',
              },
            },
          },
          placeholder: {
            propName: 'placeholder',
            label: 'Placeholder',
            description: 'Placeholder text when the field is empty',
            group: 'Content',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'Placeholder text',
              },
            },
          },
          helperText: {
            propName: 'helperText',
            label: 'Helper Text',
            description: 'Helper text displayed below the input',
            group: 'Content',
            order: 30,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'Helper text',
              },
            },
          },
          size: {
            propName: 'size',
            label: 'Size',
            description: 'The size of the text field',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                ],
              },
              uiDefaultValue: 'medium',
            },
          },
          color: {
            propName: 'color',
            label: 'Color',
            description: 'The color palette of the text field when focused',
            group: 'Appearance',
            order: 30,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'success', label: 'Success' },
                  { value: 'error', label: 'Error' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                ],
              },
              uiDefaultValue: 'primary',
            },
          },
          type: {
            propName: 'type',
            label: 'Input Type',
            description: 'The HTML input type',
            group: 'Behavior',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'text', label: 'Text' },
                  { value: 'password', label: 'Password' },
                  { value: 'email', label: 'Email' },
                  { value: 'number', label: 'Number' },
                  { value: 'tel', label: 'Telephone' },
                  { value: 'url', label: 'URL' },
                  { value: 'search', label: 'Search' },
                ],
              },
              uiDefaultValue: 'text',
            },
          },
          disabled: {
            propName: 'disabled',
            label: 'Disabled',
            description: 'If true, the text field is disabled',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          required: {
            propName: 'required',
            label: 'Required',
            description: 'If true, the field is marked as required',
            group: 'State',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          error: {
            propName: 'error',
            label: 'Error',
            description: 'If true, the field displays in an error state',
            group: 'State',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          fullWidth: {
            propName: 'fullWidth',
            label: 'Full Width',
            description: 'If true, the text field stretches to full container width',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          multiline: {
            propName: 'multiline',
            label: 'Multiline',
            description: 'If true, renders as a textarea for multi-line input',
            group: 'Behavior',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          rows: {
            propName: 'rows',
            label: 'Rows',
            description: 'Number of visible rows (when multiline)',
            group: 'Behavior',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'number', step: 1 },
              constraints: { min: 1 },
            },
          },
          onChange: {
            propName: 'onChange',
            label: 'onChange',
            description: 'Change handler function',
            group: 'Behavior',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'code',
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/TextField',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Select
      // ─────────────────────────────────────────────────────────────────────
      'mui.select': {
        typeId: 'mui.select',
        displayName: 'Select',
        tags: ['mui', 'input', 'form', 'dropdown'],
        description: 'Material UI Select dropdown for choosing from a list of options',
        props: {
          variant: {
            propName: 'variant',
            label: 'Variant',
            description: 'The visual style variant of the select',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'outlined', label: 'Outlined' },
                  { value: 'filled', label: 'Filled' },
                  { value: 'standard', label: 'Standard' },
                ],
              },
              uiDefaultValue: 'outlined',
            },
          },
          label: {
            propName: 'label',
            label: 'Label',
            description: 'The label text for the select field',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'Select label',
              },
            },
          },
          size: {
            propName: 'size',
            label: 'Size',
            description: 'The size of the select',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                ],
              },
              uiDefaultValue: 'medium',
            },
          },
          disabled: {
            propName: 'disabled',
            label: 'Disabled',
            description: 'If true, the select is disabled',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          error: {
            propName: 'error',
            label: 'Error',
            description: 'If true, the select displays in an error state',
            group: 'State',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          fullWidth: {
            propName: 'fullWidth',
            label: 'Full Width',
            description: 'If true, the select stretches to full container width',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          multiple: {
            propName: 'multiple',
            label: 'Multiple Selection',
            description: 'If true, allows selecting multiple options',
            group: 'Behavior',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          native: {
            propName: 'native',
            label: 'Native',
            description: 'If true, uses a native select element',
            group: 'Behavior',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          onChange: {
            propName: 'onChange',
            label: 'onChange',
            description: 'Change handler function',
            group: 'Behavior',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'code',
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Select menu items (MenuItem components)',
            group: 'Content',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/Select',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Checkbox
      // ─────────────────────────────────────────────────────────────────────
      'mui.checkbox': {
        typeId: 'mui.checkbox',
        displayName: 'Checkbox',
        tags: ['mui', 'input', 'form', 'toggle'],
        description: 'Material UI Checkbox for boolean selection',
        props: {
          checked: {
            propName: 'checked',
            label: 'Checked',
            description: 'If true, the checkbox is checked',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          color: {
            propName: 'color',
            label: 'Color',
            description: 'The color palette of the checkbox',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'default', label: 'Default' },
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'success', label: 'Success' },
                  { value: 'error', label: 'Error' },
                  { value: 'info', label: 'Info' },
                  { value: 'warning', label: 'Warning' },
                ],
              },
              uiDefaultValue: 'primary',
            },
          },
          size: {
            propName: 'size',
            label: 'Size',
            description: 'The size of the checkbox',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'small', label: 'Small' },
                  { value: 'medium', label: 'Medium' },
                ],
              },
              uiDefaultValue: 'medium',
            },
          },
          disabled: {
            propName: 'disabled',
            label: 'Disabled',
            description: 'If true, the checkbox is disabled',
            group: 'State',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          indeterminate: {
            propName: 'indeterminate',
            label: 'Indeterminate',
            description: 'If true, shows indeterminate (partial) state',
            group: 'State',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          required: {
            propName: 'required',
            label: 'Required',
            description: 'If true, the checkbox is marked as required',
            group: 'State',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          onChange: {
            propName: 'onChange',
            label: 'onChange',
            description: 'Change handler function',
            group: 'Behavior',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'code',
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/Checkbox',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Card
      // ─────────────────────────────────────────────────────────────────────
      'mui.card': {
        typeId: 'mui.card',
        displayName: 'Card',
        tags: ['mui', 'layout', 'container', 'surface'],
        description: 'Material UI Card for grouping content in a raised surface',
        props: {
          raised: {
            propName: 'raised',
            label: 'Raised',
            description: 'If true, displays with increased elevation',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          elevation: {
            propName: 'elevation',
            label: 'Elevation',
            description: 'Shadow depth (0-24)',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'number', step: 1 },
              uiDefaultValue: 1,
              constraints: { min: 0, max: 24 },
            },
          },
          square: {
            propName: 'square',
            label: 'Square',
            description: 'If true, disables rounded corners',
            group: 'Appearance',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Card content (typically CardContent, CardActions, etc.)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/Card',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Typography
      // ─────────────────────────────────────────────────────────────────────
      'mui.typography': {
        typeId: 'mui.typography',
        displayName: 'Typography',
        tags: ['mui', 'text', 'typography'],
        description: 'Material UI Typography for styled text rendering',
        props: {
          variant: {
            propName: 'variant',
            label: 'Variant',
            description: 'The typographic style variant',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'h1', label: 'Heading 1' },
                  { value: 'h2', label: 'Heading 2' },
                  { value: 'h3', label: 'Heading 3' },
                  { value: 'h4', label: 'Heading 4' },
                  { value: 'h5', label: 'Heading 5' },
                  { value: 'h6', label: 'Heading 6' },
                  { value: 'subtitle1', label: 'Subtitle 1' },
                  { value: 'subtitle2', label: 'Subtitle 2' },
                  { value: 'body1', label: 'Body 1' },
                  { value: 'body2', label: 'Body 2' },
                  { value: 'button', label: 'Button' },
                  { value: 'caption', label: 'Caption' },
                  { value: 'overline', label: 'Overline' },
                  { value: 'inherit', label: 'Inherit' },
                ],
              },
              uiDefaultValue: 'body1',
            },
          },
          color: {
            propName: 'color',
            label: 'Color',
            description: 'The text color',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'inherit', label: 'Inherit' },
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'textPrimary', label: 'Text Primary' },
                  { value: 'textSecondary', label: 'Text Secondary' },
                  { value: 'error', label: 'Error' },
                ],
              },
              uiDefaultValue: 'inherit',
            },
          },
          align: {
            propName: 'align',
            label: 'Alignment',
            description: 'Text alignment',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'inherit', label: 'Inherit' },
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Center' },
                  { value: 'right', label: 'Right' },
                  { value: 'justify', label: 'Justify' },
                ],
              },
              uiDefaultValue: 'inherit',
            },
          },
          gutterBottom: {
            propName: 'gutterBottom',
            label: 'Gutter Bottom',
            description: 'If true, adds a bottom margin',
            group: 'Layout',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          noWrap: {
            propName: 'noWrap',
            label: 'No Wrap',
            description: 'If true, text does not wrap and truncates with ellipsis',
            group: 'Layout',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          paragraph: {
            propName: 'paragraph',
            label: 'Paragraph',
            description: 'If true, adds paragraph margins',
            group: 'Layout',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Text content',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@mui/material/Typography',
        },
      },
    },
  };

  context.registry.contributeRegistry(registry);
  console.log(
    '[MUIRegistry] Contributed component registry for:',
    Object.keys(registry.components).join(', ')
  );

  console.log('[MUIRegistry] Activated');
}

export function deactivate() {
  console.log('[MUIRegistry] Deactivated');
}
