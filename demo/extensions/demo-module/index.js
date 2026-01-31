// ─────────────────────────────────────────────────────────────────────────────
// Demo Module (v0) - Component Registry Provider
// ─────────────────────────────────────────────────────────────────────────────
// Provides component registry metadata for demo.button and demo.card components.

export function activate(context) {
  console.log("[DemoModule] Activating...");

  // Register component registry for demo components
  const registry = {
    schemaVersion: "v0",
    components: {
      "demo.button": {
        typeId: "demo.button",
        displayName: "Demo Button",
        tags: ["demo", "button", "interactive"],
        description:
          "A sample button component for demonstrating Skaffa Inspector",
        props: {
          label: {
            propName: "label",
            label: "Label",
            description: "The text displayed on the button",
            group: "Content",
            order: 10,
            exposure: {
              kind: "editable",
              control: {
                kind: "string",
                placeholder: "Enter button label",
              },
              uiDefaultValue: "Click me",
              constraints: {
                required: true,
              },
            },
          },
          variant: {
            propName: "variant",
            label: "Variant",
            description: "Visual style variant of the button",
            group: "Appearance",
            order: 10,
            exposure: {
              kind: "editable",
              control: {
                kind: "select",
                options: [
                  {
                    value: "primary",
                    label: "Primary",
                    description: "Blue primary button",
                  },
                  {
                    value: "secondary",
                    label: "Secondary",
                    description: "Gray secondary button",
                  },
                  {
                    value: "danger",
                    label: "Danger",
                    description: "Red danger button",
                  },
                ],
              },
              uiDefaultValue: "primary",
            },
          },
          onClick: {
            propName: "onClick",
            label: "onClick",
            description: "Click handler function",
            group: "Behavior",
            order: 999,
            exposure: {
              kind: "inspectOnly",
              displayHint: "code",
            },
          },
        },
        // Implementation hint for registry-driven instrumentation
        // See: docs/skaffa_component_registry_schema.md (5.1)
        implementation: {
          kind: "file",
          filePath: "app/src/components/DemoButton.tsx",
          exportName: "DemoButton",
        },
      },
      "demo.card": {
        typeId: "demo.card",
        displayName: "Demo Card",
        tags: ["demo", "card", "layout"],
        description:
          "A sample card component for demonstrating Skaffa Inspector",
        props: {
          title: {
            propName: "title",
            label: "Title",
            description: "The card title text",
            group: "Content",
            order: 10,
            exposure: {
              kind: "editable",
              control: {
                kind: "string",
                placeholder: "Enter card title",
              },
              uiDefaultValue: "Card Title",
              constraints: {
                required: true,
              },
            },
          },
          description: {
            propName: "description",
            label: "Description",
            description: "The card description text",
            group: "Content",
            order: 20,
            exposure: {
              kind: "editable",
              control: {
                kind: "string",
                placeholder: "Enter card description",
                multiline: true,
              },
              uiDefaultValue: "Card description",
            },
          },
          variant: {
            propName: "variant",
            label: "Variant",
            description: "Visual style variant of the card",
            group: "Appearance",
            order: 10,
            exposure: {
              kind: "editable",
              control: {
                kind: "select",
                options: [
                  {
                    value: "primary",
                    label: "Primary",
                    description: "Blue primary card",
                  },
                  {
                    value: "secondary",
                    label: "Secondary",
                    description: "Gray secondary card",
                  },
                  {
                    value: "accent",
                    label: "Accent",
                    description: "Yellow accent card",
                  },
                ],
              },
              uiDefaultValue: "primary",
            },
          },
        },
        // Implementation hint for registry-driven instrumentation
        // See: docs/skaffa_component_registry_schema.md (5.1)
        implementation: {
          kind: "file",
          filePath: "app/src/components/DemoCard.tsx",
          exportName: "DemoCard",
        },
      },
    },
  };

  context.registry.contributeRegistry(registry);
  console.log(
    "[DemoModule] Contributed component registry for demo.button and demo.card",
  );

  console.log("[DemoModule] Activated");
}

export function deactivate() {
  console.log("[DemoModule] Deactivated");
}
