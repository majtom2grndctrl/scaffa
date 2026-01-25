// ─────────────────────────────────────────────────────────────────────────────
// Layout Module (v0) - Component Registry Provider
// ─────────────────────────────────────────────────────────────────────────────
// Provides component registry metadata for layout primitives: Box, Row, Stack.

export function activate(context) {
  console.log('[LayoutModule] Activating...');

  // Spacing scale values (0..16)
  const spacingOptions = Array.from({ length: 17 }, (_, i) => ({
    value: String(i),
    label: String(i),
    description: `Spacing value ${i}`,
  }));

  // Gap includes spacing scale plus auto/space-between and explicit unset
  const gapOptions = [
    { value: 'unset', label: 'Unset', description: 'Remove gap override' },
    ...spacingOptions,
    { value: 'space-between', label: 'Space Between', description: 'Space items evenly with gaps between' },
  ];

  // Spacing axis variants include scale plus explicit unset
  const spacingAxisOptions = [
    { value: 'unset', label: 'Unset', description: 'Remove spacing override' },
    ...spacingOptions,
  ];

  const registry = {
    schemaVersion: 'v0',
    components: {
      'layout.box': {
        typeId: 'layout.box',
        displayName: 'Box',
        tags: ['layout', 'primitive', 'container'],
        description: 'A flexible container component with spacing and alignment props',
        props: {
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Child elements to render inside the box',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'slot',
                slotName: 'children',
                editable: false,
              },
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
          // Padding axis variants
          p: {
            propName: 'p',
            label: 'Padding (All)',
            description: 'Padding on all sides',
            group: 'Spacing',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          px: {
            propName: 'px',
            label: 'Padding X',
            description: 'Horizontal padding (left + right)',
            group: 'Spacing',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          py: {
            propName: 'py',
            label: 'Padding Y',
            description: 'Vertical padding (top + bottom)',
            group: 'Spacing',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pt: {
            propName: 'pt',
            label: 'Padding Top',
            description: 'Padding at the top',
            group: 'Spacing',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pr: {
            propName: 'pr',
            label: 'Padding Right',
            description: 'Padding on the right',
            group: 'Spacing',
            order: 50,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pb: {
            propName: 'pb',
            label: 'Padding Bottom',
            description: 'Padding at the bottom',
            group: 'Spacing',
            order: 60,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pl: {
            propName: 'pl',
            label: 'Padding Left',
            description: 'Padding on the left',
            group: 'Spacing',
            order: 70,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          // Margin axis variants
          m: {
            propName: 'm',
            label: 'Margin (All)',
            description: 'Margin on all sides',
            group: 'Spacing',
            order: 80,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mx: {
            propName: 'mx',
            label: 'Margin X',
            description: 'Horizontal margin (left + right)',
            group: 'Spacing',
            order: 90,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          my: {
            propName: 'my',
            label: 'Margin Y',
            description: 'Vertical margin (top + bottom)',
            group: 'Spacing',
            order: 100,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mt: {
            propName: 'mt',
            label: 'Margin Top',
            description: 'Margin at the top',
            group: 'Spacing',
            order: 110,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mr: {
            propName: 'mr',
            label: 'Margin Right',
            description: 'Margin on the right',
            group: 'Spacing',
            order: 120,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mb: {
            propName: 'mb',
            label: 'Margin Bottom',
            description: 'Margin at the bottom',
            group: 'Spacing',
            order: 130,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          ml: {
            propName: 'ml',
            label: 'Margin Left',
            description: 'Margin on the left',
            group: 'Spacing',
            order: 140,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          // Alignment
          alignSelf: {
            propName: 'alignSelf',
            label: 'Align Self',
            description: 'Alignment of this box within its parent flex container',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove alignment override' },
                  { value: 'start', label: 'Start', description: 'Align to start of cross axis' },
                  { value: 'center', label: 'Center', description: 'Center on cross axis' },
                  { value: 'end', label: 'End', description: 'Align to end of cross axis' },
                  { value: 'stretch', label: 'Stretch', description: 'Stretch to fill cross axis' },
                ],
              },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@scaffa/layout-primitives-react',
          exportName: 'Box',
        },
      },
      'layout.row': {
        typeId: 'layout.row',
        displayName: 'Row',
        tags: ['layout', 'primitive', 'flex', 'horizontal'],
        description: 'A horizontal flex container (row) with gap, alignment, and spacing props',
        props: {
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Child elements to arrange in a row',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'slot',
                slotName: 'children',
                editable: false,
              },
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
          // Layout props
          gap: {
            propName: 'gap',
            label: 'Gap',
            description: 'Spacing between child items',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: gapOptions },
            },
          },
          align: {
            propName: 'align',
            label: 'Align Items',
            description: 'Alignment of items along the cross axis (vertical)',
            group: 'Layout',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove alignment override' },
                  { value: 'start', label: 'Start', description: 'Align items to start' },
                  { value: 'center', label: 'Center', description: 'Center items' },
                  { value: 'end', label: 'End', description: 'Align items to end' },
                  { value: 'stretch', label: 'Stretch', description: 'Stretch items to fill' },
                ],
              },
            },
          },
          justify: {
            propName: 'justify',
            label: 'Justify Content',
            description: 'Alignment of items along the main axis (horizontal)',
            group: 'Layout',
            order: 30,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove justification override' },
                  { value: 'start', label: 'Start', description: 'Pack items to start' },
                  { value: 'center', label: 'Center', description: 'Center items' },
                  { value: 'end', label: 'End', description: 'Pack items to end' },
                  { value: 'between', label: 'Space Between', description: 'Space items evenly with gaps between' },
                  { value: 'around', label: 'Space Around', description: 'Space items with equal space around each' },
                  { value: 'evenly', label: 'Space Evenly', description: 'Space items with equal gaps' },
                ],
              },
            },
          },
          wrap: {
            propName: 'wrap',
            label: 'Wrap',
            description: 'Whether items should wrap to new lines',
            group: 'Layout',
            order: 40,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove wrap override' },
                  { value: 'nowrap', label: 'No Wrap', description: 'Keep items on single line' },
                  { value: 'wrap', label: 'Wrap', description: 'Wrap items to new lines' },
                  { value: 'wrap-reverse', label: 'Wrap Reverse', description: 'Wrap items in reverse order' },
                ],
              },
            },
          },
          direction: {
            propName: 'direction',
            label: 'Direction',
            description: 'Direction of the row (normal = left-to-right, reverse = right-to-left)',
            group: 'Layout',
            order: 50,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove direction override' },
                  { value: 'normal', label: 'Normal', description: 'Left to right' },
                  { value: 'reverse', label: 'Reverse', description: 'Right to left' },
                ],
              },
            },
          },
          // Padding axis variants (same as Box)
          p: {
            propName: 'p',
            label: 'Padding (All)',
            description: 'Padding on all sides',
            group: 'Spacing',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          px: {
            propName: 'px',
            label: 'Padding X',
            description: 'Horizontal padding (left + right)',
            group: 'Spacing',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          py: {
            propName: 'py',
            label: 'Padding Y',
            description: 'Vertical padding (top + bottom)',
            group: 'Spacing',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pt: {
            propName: 'pt',
            label: 'Padding Top',
            description: 'Padding at the top',
            group: 'Spacing',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pr: {
            propName: 'pr',
            label: 'Padding Right',
            description: 'Padding on the right',
            group: 'Spacing',
            order: 50,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pb: {
            propName: 'pb',
            label: 'Padding Bottom',
            description: 'Padding at the bottom',
            group: 'Spacing',
            order: 60,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pl: {
            propName: 'pl',
            label: 'Padding Left',
            description: 'Padding on the left',
            group: 'Spacing',
            order: 70,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          // Margin axis variants (same as Box)
          m: {
            propName: 'm',
            label: 'Margin (All)',
            description: 'Margin on all sides',
            group: 'Spacing',
            order: 80,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mx: {
            propName: 'mx',
            label: 'Margin X',
            description: 'Horizontal margin (left + right)',
            group: 'Spacing',
            order: 90,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          my: {
            propName: 'my',
            label: 'Margin Y',
            description: 'Vertical margin (top + bottom)',
            group: 'Spacing',
            order: 100,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mt: {
            propName: 'mt',
            label: 'Margin Top',
            description: 'Margin at the top',
            group: 'Spacing',
            order: 110,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mr: {
            propName: 'mr',
            label: 'Margin Right',
            description: 'Margin on the right',
            group: 'Spacing',
            order: 120,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mb: {
            propName: 'mb',
            label: 'Margin Bottom',
            description: 'Margin at the bottom',
            group: 'Spacing',
            order: 130,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          ml: {
            propName: 'ml',
            label: 'Margin Left',
            description: 'Margin on the left',
            group: 'Spacing',
            order: 140,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@scaffa/layout-primitives-react',
          exportName: 'Row',
        },
      },
      'layout.stack': {
        typeId: 'layout.stack',
        displayName: 'Stack',
        tags: ['layout', 'primitive', 'flex', 'vertical'],
        description: 'A vertical flex container (column) with gap, alignment, and spacing props',
        props: {
          children: {
            propName: 'children',
            label: 'Children',
            description: 'Child elements to arrange in a stack',
            group: 'Content',
            order: 10,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'slot',
                slotName: 'children',
                editable: false,
              },
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
          // Layout props (same as Row but with different axis semantics)
          gap: {
            propName: 'gap',
            label: 'Gap',
            description: 'Spacing between child items',
            group: 'Layout',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: gapOptions },
            },
          },
          align: {
            propName: 'align',
            label: 'Align Items',
            description: 'Alignment of items along the cross axis (horizontal)',
            group: 'Layout',
            order: 20,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove alignment override' },
                  { value: 'start', label: 'Start', description: 'Align items to start' },
                  { value: 'center', label: 'Center', description: 'Center items' },
                  { value: 'end', label: 'End', description: 'Align items to end' },
                  { value: 'stretch', label: 'Stretch', description: 'Stretch items to fill' },
                ],
              },
            },
          },
          justify: {
            propName: 'justify',
            label: 'Justify Content',
            description: 'Alignment of items along the main axis (vertical)',
            group: 'Layout',
            order: 30,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove justification override' },
                  { value: 'start', label: 'Start', description: 'Pack items to start' },
                  { value: 'center', label: 'Center', description: 'Center items' },
                  { value: 'end', label: 'End', description: 'Pack items to end' },
                  { value: 'between', label: 'Space Between', description: 'Space items evenly with gaps between' },
                  { value: 'around', label: 'Space Around', description: 'Space items with equal space around each' },
                  { value: 'evenly', label: 'Space Evenly', description: 'Space items with equal gaps' },
                ],
              },
            },
          },
          wrap: {
            propName: 'wrap',
            label: 'Wrap',
            description: 'Whether items should wrap to new lines',
            group: 'Layout',
            order: 40,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove wrap override' },
                  { value: 'nowrap', label: 'No Wrap', description: 'Keep items on single line' },
                  { value: 'wrap', label: 'Wrap', description: 'Wrap items to new lines' },
                  { value: 'wrap-reverse', label: 'Wrap Reverse', description: 'Wrap items in reverse order' },
                ],
              },
            },
          },
          direction: {
            propName: 'direction',
            label: 'Direction',
            description: 'Direction of the stack (normal = top-to-bottom, reverse = bottom-to-top)',
            group: 'Layout',
            order: 50,
            exposure: {
              kind: 'editable',
              control: {
                kind: 'select',
                options: [
                  { value: 'unset', label: 'Unset', description: 'Remove direction override' },
                  { value: 'normal', label: 'Normal', description: 'Top to bottom' },
                  { value: 'reverse', label: 'Reverse', description: 'Bottom to top' },
                ],
              },
            },
          },
          // Padding axis variants (same as Box and Row)
          p: {
            propName: 'p',
            label: 'Padding (All)',
            description: 'Padding on all sides',
            group: 'Spacing',
            order: 10,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          px: {
            propName: 'px',
            label: 'Padding X',
            description: 'Horizontal padding (left + right)',
            group: 'Spacing',
            order: 20,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          py: {
            propName: 'py',
            label: 'Padding Y',
            description: 'Vertical padding (top + bottom)',
            group: 'Spacing',
            order: 30,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pt: {
            propName: 'pt',
            label: 'Padding Top',
            description: 'Padding at the top',
            group: 'Spacing',
            order: 40,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pr: {
            propName: 'pr',
            label: 'Padding Right',
            description: 'Padding on the right',
            group: 'Spacing',
            order: 50,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pb: {
            propName: 'pb',
            label: 'Padding Bottom',
            description: 'Padding at the bottom',
            group: 'Spacing',
            order: 60,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          pl: {
            propName: 'pl',
            label: 'Padding Left',
            description: 'Padding on the left',
            group: 'Spacing',
            order: 70,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          // Margin axis variants (same as Box and Row)
          m: {
            propName: 'm',
            label: 'Margin (All)',
            description: 'Margin on all sides',
            group: 'Spacing',
            order: 80,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mx: {
            propName: 'mx',
            label: 'Margin X',
            description: 'Horizontal margin (left + right)',
            group: 'Spacing',
            order: 90,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          my: {
            propName: 'my',
            label: 'Margin Y',
            description: 'Vertical margin (top + bottom)',
            group: 'Spacing',
            order: 100,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mt: {
            propName: 'mt',
            label: 'Margin Top',
            description: 'Margin at the top',
            group: 'Spacing',
            order: 110,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mr: {
            propName: 'mr',
            label: 'Margin Right',
            description: 'Margin on the right',
            group: 'Spacing',
            order: 120,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          mb: {
            propName: 'mb',
            label: 'Margin Bottom',
            description: 'Margin at the bottom',
            group: 'Spacing',
            order: 130,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
          ml: {
            propName: 'ml',
            label: 'Margin Left',
            description: 'Margin on the left',
            group: 'Spacing',
            order: 140,
            exposure: {
              kind: 'editable',
              control: { kind: 'select', options: spacingAxisOptions },
            },
          },
        },
        implementation: {
          kind: 'package',
          specifier: '@scaffa/layout-primitives-react',
          exportName: 'Stack',
        },
      },
    },
  };

  context.registry.contributeRegistry(registry);
  console.log('[LayoutModule] Contributed component registry for layout.box, layout.row, and layout.stack');

  // Register inspector section for layout components
  // The section ID 'layout.layout' maps to the pre-bundled LayoutSection component
  // in src/renderer/extensions/pre-bundle-loader.ts
  context.ui.registerInspectorSection({
    id: 'layout.layout' as any, // Cast to branded type
    title: 'Layout',
    order: 1000, // Extension sections use 1000+
    extensionId: 'layout',
    componentPath: 'inspector-sections/LayoutSection',
    componentExport: 'default',
  });
  console.log('[LayoutModule] Registered inspector section: layout.layout');

  console.log('[LayoutModule] Activated');
}

export function deactivate() {
  console.log('[LayoutModule] Deactivated');
}
