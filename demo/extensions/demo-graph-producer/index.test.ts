import { describe, expect, it } from 'vitest';
import type { Disposable, ExtensionContext, GraphProducer } from '../../../extension-sdk.js';
import { activate } from './index.js';

const noopDisposable: Disposable = {
  dispose: () => {},
};

function createTestContext(onRegister: (producer: GraphProducer) => void): ExtensionContext {
  return {
    apiVersion: 'v0',
    extensionId: 'demo-graph-producer',
    workspaceRoot: '/tmp/demo-workspace',
    registry: {
      contributeRegistry: () => noopDisposable,
    },
    graph: {
      registerProducer: (producer: GraphProducer) => {
        onRegister(producer);
        return noopDisposable;
      },
    },
    preview: {
      registerLauncher: () => noopDisposable,
    },
    save: {
      registerPromoter: () => noopDisposable,
    },
    ui: {
      registerInspectorSection: () => noopDisposable,
    },
    subscriptions: [],
  };
}

describe('demo-graph-producer', () => {
  it('emits componentType nodes with workspace-relative sources', async () => {
    let registered: GraphProducer | null = null;
    const context = createTestContext((producer) => {
      registered = producer;
    });

    activate(context);

    expect(registered).not.toBeNull();

    const snapshot = await registered!.initialize();
    expect(snapshot.nodes).toHaveLength(10);
    expect(snapshot.edges).toHaveLength(0);
    expect(snapshot.nodes.every((node) => node.kind === 'componentType')).toBe(true);

    const componentTypeIds = snapshot.nodes.map((node) =>
      node.kind === 'componentType' ? node.id : ''
    );
    expect(componentTypeIds).toEqual(
      expect.arrayContaining([
        'ui.button',
        'ui.card',
        'ui.input',
        'ui.checkbox',
        'ui.select',
        'ui.badge',
        'ui.dialog',
        'layout.box',
        'layout.row',
        'layout.stack',
      ])
    );

    for (const node of snapshot.nodes) {
      if (node.kind !== 'componentType' || !node.source) {
        continue;
      }

      expect(
        node.source.filePath.startsWith('app/') ||
          node.source.filePath.startsWith('app/node_modules/')
      ).toBe(true);
      expect(node.source.filePath.startsWith('demo/')).toBe(false);
    }
  });
});
