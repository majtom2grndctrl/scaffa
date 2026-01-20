import type { ExtensionContext } from '../extension-context.js';

export async function activate(context: ExtensionContext): Promise<void> {
  context.registry.contributeRegistry({
    schemaVersion: 'v0',
    components: {
      'test.component': {
        displayName: 'Test Component',
        props: {},
      },
    },
  });
}
