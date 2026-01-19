// ─────────────────────────────────────────────────────────────────────────────
// shadcn/ui Registry Module (v0) - Component Registry Provider
// ─────────────────────────────────────────────────────────────────────────────
// Provides component registry metadata for shadcn/ui components.
// See: docs/scaffa_component_registry_schema.md
// TypeId namespace: ui.* (see README.md for rationale)

import type { ExtensionContext, ComponentRegistry } from '../../../extension-sdk.js';

export function activate(context: ExtensionContext): void {
  console.log('[ShadcnUIRegistry] Activating...');

  const registry: ComponentRegistry = {
    schemaVersion: 'v0' as const,
    components: {
      // ─────────────────────────────────────────────────────────────────────
      // Button
      // ─────────────────────────────────────────────────────────────────────
      'ui.button': {
        typeId: 'ui.button',
        displayName: 'Button',
        tags: ['ui', 'button', 'interactive', 'input'],
        description: 'shadcn/ui Button component for user actions and navigation',
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
                  { value: 'default', label: 'Default', description: 'Default filled style' },
                  { value: 'destructive', label: 'Destructive', description: 'Danger/delete actions' },
                  { value: 'outline', label: 'Outline', description: 'Border-only style' },
                  { value: 'secondary', label: 'Secondary', description: 'Secondary action style' },
                  { value: 'ghost', label: 'Ghost', description: 'Minimal transparent style' },
                  { value: 'link', label: 'Link', description: 'Text link style' },
                ],
              },
              uiDefaultValue: 'default',
            },
          },
          size: {
            propName: 'size',
            label: 'Size',
            description: 'The size of the button',
            group: 'Appearance',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'default', label: 'Default' },
                  { value: 'sm', label: 'Small' },
                  { value: 'lg', label: 'Large' },
                  { value: 'icon', label: 'Icon', description: 'Square icon-only button' },
                ],
              },
              uiDefaultValue: 'default',
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
          asChild: {
            propName: 'asChild',
            label: 'As Child',
            description: 'Merge props into the child element (Radix pattern)',
            group: 'Behavior',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
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
          kind: 'file',
          filePath: 'src/components/ui/button.tsx',
          exportName: 'Button',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Card
      // ─────────────────────────────────────────────────────────────────────
      'ui.card': {
        typeId: 'ui.card',
        displayName: 'Card',
        tags: ['ui', 'layout', 'container', 'surface'],
        description: 'shadcn/ui Card for grouping content in a bordered surface',
        props: {
          className: {
            propName: 'className',
            label: 'CSS Class',
            description: 'Additional CSS class names',
            group: 'Appearance',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'summary',
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Card content (typically CardHeader, CardContent, CardFooter)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/card.tsx',
          exportName: 'Card',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Input
      // ─────────────────────────────────────────────────────────────────────
      'ui.input': {
        typeId: 'ui.input',
        displayName: 'Input',
        tags: ['ui', 'input', 'form', 'text'],
        description: 'shadcn/ui Input for text input with optional validation',
        props: {
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
                  { value: 'date', label: 'Date' },
                  { value: 'time', label: 'Time' },
                  { value: 'datetime-local', label: 'Date & Time' },
                ],
              },
              uiDefaultValue: 'text',
            },
          },
          placeholder: {
            propName: 'placeholder',
            label: 'Placeholder',
            description: 'Placeholder text when the field is empty',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'string',
                placeholder: 'Placeholder text',
              },
            },
          },
          disabled: {
            propName: 'disabled',
            label: 'Disabled',
            description: 'If true, the input is disabled',
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
          readOnly: {
            propName: 'readOnly',
            label: 'Read Only',
            description: 'If true, the input is read-only',
            group: 'State',
            order: 30,
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
          className: {
            propName: 'className',
            label: 'CSS Class',
            description: 'Additional CSS class names',
            group: 'Appearance',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'summary',
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/input.tsx',
          exportName: 'Input',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Checkbox
      // ─────────────────────────────────────────────────────────────────────
      'ui.checkbox': {
        typeId: 'ui.checkbox',
        displayName: 'Checkbox',
        tags: ['ui', 'input', 'form', 'toggle'],
        description: 'shadcn/ui Checkbox for boolean selection',
        props: {
          checked: {
            propName: 'checked',
            label: 'Checked',
            description: 'The controlled checked state',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
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
          required: {
            propName: 'required',
            label: 'Required',
            description: 'If true, the checkbox is marked as required',
            group: 'State',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          onCheckedChange: {
            propName: 'onCheckedChange',
            label: 'onCheckedChange',
            description: 'Change handler function',
            group: 'Behavior',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'code',
            },
          },
          className: {
            propName: 'className',
            label: 'CSS Class',
            description: 'Additional CSS class names',
            group: 'Appearance',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'summary',
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/checkbox.tsx',
          exportName: 'Checkbox',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Select
      // ─────────────────────────────────────────────────────────────────────
      'ui.select': {
        typeId: 'ui.select',
        displayName: 'Select',
        tags: ['ui', 'input', 'form', 'dropdown'],
        description: 'shadcn/ui Select dropdown for choosing from a list of options',
        props: {
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
          required: {
            propName: 'required',
            label: 'Required',
            description: 'If true, the select is marked as required',
            group: 'State',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          onValueChange: {
            propName: 'onValueChange',
            label: 'onValueChange',
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
            description: 'Select content (SelectTrigger, SelectContent, SelectItem)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/select.tsx',
          exportName: 'Select',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Badge
      // ─────────────────────────────────────────────────────────────────────
      'ui.badge': {
        typeId: 'ui.badge',
        displayName: 'Badge',
        tags: ['ui', 'badge', 'label', 'status'],
        description: 'shadcn/ui Badge for displaying status, labels, or counts',
        props: {
          variant: {
            propName: 'variant',
            label: 'Variant',
            description: 'The visual style variant of the badge',
            group: 'Appearance',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'default', label: 'Default', description: 'Default filled style' },
                  { value: 'secondary', label: 'Secondary', description: 'Secondary muted style' },
                  { value: 'destructive', label: 'Destructive', description: 'Danger/error style' },
                  { value: 'outline', label: 'Outline', description: 'Border-only style' },
                ],
              },
              uiDefaultValue: 'default',
            },
          },
          className: {
            propName: 'className',
            label: 'CSS Class',
            description: 'Additional CSS class names',
            group: 'Appearance',
            order: 999,
            exposure: {
              kind: 'inspectOnly',
              displayHint: 'summary',
            },
          },
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Badge content (typically text)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/badge.tsx',
          exportName: 'Badge',
        },
      },

      // ─────────────────────────────────────────────────────────────────────
      // Dialog
      // ─────────────────────────────────────────────────────────────────────
      'ui.dialog': {
        typeId: 'ui.dialog',
        displayName: 'Dialog',
        tags: ['ui', 'dialog', 'modal', 'overlay'],
        description: 'shadcn/ui Dialog for modal dialogs and overlays',
        props: {
          open: {
            propName: 'open',
            label: 'Open',
            description: 'The controlled open state of the dialog',
            group: 'State',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: false,
            },
          },
          modal: {
            propName: 'modal',
            label: 'Modal',
            description: 'If true, renders as a modal (blocks interaction with rest of page)',
            group: 'Behavior',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'boolean' },
              uiDefaultValue: true,
            },
          },
          onOpenChange: {
            propName: 'onOpenChange',
            label: 'onOpenChange',
            description: 'Open state change handler function',
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
            description: 'Dialog content (DialogTrigger, DialogContent, etc.)',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'slot', slotName: 'children', editable: false },
            },
          },
        },
        implementation: {
          kind: 'file',
          filePath: 'src/components/ui/dialog.tsx',
          exportName: 'Dialog',
        },
      },
    },
  };

  context.registry.contributeRegistry(registry);
  console.log(
    '[ShadcnUIRegistry] Contributed component registry for:',
    Object.keys(registry.components).join(', ')
  );

  console.log('[ShadcnUIRegistry] Activated');
}

export function deactivate(): void {
  console.log('[ShadcnUIRegistry] Deactivated');
}
