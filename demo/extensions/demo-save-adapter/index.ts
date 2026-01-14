// ─────────────────────────────────────────────────────────────────────────────
// Demo Save Adapter (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Promotes draft overrides into edits for demo/app/src/App.tsx.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as ts from 'typescript';
import type { ExtensionContext, SavePromoter } from '../../../src/extension-host/extension-context.js';
import type { DraftOverride, SaveFailure, SavePlan } from '../../../src/shared/save.js';
import type { FileEdit, TextEdit } from '../../../src/shared/workspace-edits.js';

const APP_ENTRY = 'app/src/App.tsx';

const COMPONENT_NAME_BY_TYPE: Record<string, string> = {
  'demo.button': 'DemoButton',
  'demo.card': 'DemoCard',
};

export function activate(context: ExtensionContext): void {
  console.log('[DemoSaveAdapter] Activating...');

  const promoter: SavePromoter = {
    id: 'demo-save-adapter',
    displayName: 'Demo Save Adapter',
    promote: async (overrides: DraftOverride[]): Promise<SavePlan> => {
      return buildSavePlan(context, overrides);
    },
  };

  context.save.registerPromoter(promoter);
  console.log('[DemoSaveAdapter] Registered');
}

export function deactivate(): void {
  console.log('[DemoSaveAdapter] Deactivated');
}

async function buildSavePlan(
  context: ExtensionContext,
  overrides: DraftOverride[]
): Promise<SavePlan> {
  if (!context.workspaceRoot) {
    return {
      edits: [],
      failed: overrides.map((override) =>
        toFailure(override, 'internalError', 'Workspace root is not available.')
      ),
    };
  }

  const appPath = join(context.workspaceRoot, APP_ENTRY);
  let sourceText: string;
  try {
    sourceText = await readFile(appPath, 'utf-8');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to read App.tsx';
    return {
      edits: [],
      failed: overrides.map((override) =>
        toFailure(override, 'internalError', message)
      ),
    };
  }

  const sourceFile = ts.createSourceFile(
    appPath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX
  );

  const elementsByName = collectJsxElements(sourceFile);
  const textEdits: TextEdit[] = [];
  const failed: SaveFailure[] = [];

  for (const override of overrides) {
    const componentTypeId = override.componentTypeId;
    if (!componentTypeId) {
      failed.push(
        toFailure(override, 'unpromotable', 'Missing component type metadata.')
      );
      continue;
    }

    const componentName = COMPONENT_NAME_BY_TYPE[componentTypeId];
    if (!componentName) {
      failed.push(
        toFailure(
          override,
          'unpromotable',
          `No save mapping for component type "${componentTypeId}".`
        )
      );
      continue;
    }

    const locator = parseRenderIndex(override.instanceLocator);
    if (!locator.ok) {
      failed.push(toFailure(override, 'unpromotable', locator.message));
      continue;
    }

    const instances = elementsByName.get(componentName) ?? [];
    const instance = instances[locator.index];
    if (!instance) {
      failed.push(
        toFailure(
          override,
          'notFound',
          `Could not find ${componentName} instance #${locator.index + 1}.`
        )
      );
      continue;
    }

    const propName = parsePropName(override.path);
    if (!propName) {
      failed.push(
        toFailure(
          override,
          'unsupportedPattern',
          `Unsupported prop path "${override.path}".`
        )
      );
      continue;
    }

    const attribute = findAttribute(instance, propName);
    if (!attribute) {
      failed.push(
        toFailure(
          override,
          'unsupportedPattern',
          `Prop "${propName}" not found on ${componentName}.`
        )
      );
      continue;
    }

    const edit = buildAttributeEdit(sourceFile, attribute, override.value);
    if (!edit.ok) {
      failed.push(toFailure(override, 'unsupportedPattern', edit.message));
      continue;
    }

    textEdits.push(edit.value);
  }

  if (textEdits.length === 0) {
    return { edits: [], failed };
  }

  textEdits.sort((a, b) => a.range.start - b.range.start);

  const edits: FileEdit[] = [
    {
      kind: 'text',
      filePath: APP_ENTRY,
      edits: textEdits,
    },
  ];

  return { edits, failed };
}

function collectJsxElements(
  sourceFile: ts.SourceFile
): Map<string, Array<ts.JsxOpeningLikeElement>> {
  const elements = new Map<string, Array<ts.JsxOpeningLikeElement>>();

  const visit = (node: ts.Node) => {
    if (ts.isJsxSelfClosingElement(node) || ts.isJsxOpeningElement(node)) {
      const name = node.tagName.getText(sourceFile);
      const list = elements.get(name) ?? [];
      list.push(node);
      elements.set(name, list);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return elements;
}

function parseRenderIndex(
  locator: DraftOverride['instanceLocator']
): { ok: true; index: number } | { ok: false; message: string } {
  if (!locator || typeof locator !== 'object') {
    return { ok: false, message: 'Missing instance locator metadata.' };
  }

  const kind = (locator as { kind?: unknown }).kind;
  const index = (locator as { index?: unknown }).index;

  if (kind !== 'renderIndex' || typeof index !== 'number' || index < 0) {
    return { ok: false, message: 'Unsupported instance locator format.' };
  }

  return { ok: true, index };
}

function parsePropName(path: string): string | null {
  if (!path.startsWith('/')) {
    return null;
  }

  const parts = path.slice(1).split('/');
  if (parts.length !== 1) {
    return null;
  }

  return parts[0] || null;
}

function findAttribute(
  element: ts.JsxOpeningLikeElement,
  propName: string
): ts.JsxAttribute | null {
  for (const attr of element.attributes.properties) {
    if (!ts.isJsxAttribute(attr)) {
      continue;
    }
    if (attr.name.text === propName) {
      return attr;
    }
  }
  return null;
}

function buildAttributeEdit(
  sourceFile: ts.SourceFile,
  attribute: ts.JsxAttribute,
  value: DraftOverride['value']
): { ok: true; value: TextEdit } | { ok: false; message: string } {
  const initializer = attribute.initializer;
  if (!initializer) {
    return { ok: false, message: 'Boolean shorthand props are not supported.' };
  }

  if (!isSupportedInitializer(initializer)) {
    return { ok: false, message: 'Only literal JSX props can be promoted.' };
  }

  const newText = renderJsxValue(value, ts.isJsxExpression(initializer));
  if (!newText) {
    return { ok: false, message: 'Unsupported override value type.' };
  }

  return {
    ok: true,
    value: {
      range: {
        start: initializer.getStart(sourceFile),
        end: initializer.getEnd(),
      },
      newText,
    },
  };
}

function isSupportedInitializer(initializer: ts.JsxAttribute['initializer']): boolean {
  if (!initializer) {
    return false;
  }

  if (ts.isStringLiteral(initializer)) {
    return true;
  }

  if (ts.isJsxExpression(initializer)) {
    const expression = initializer.expression;
    if (!expression) {
      return false;
    }
    return (
      ts.isStringLiteral(expression) ||
      ts.isNumericLiteral(expression) ||
      expression.kind === ts.SyntaxKind.TrueKeyword ||
      expression.kind === ts.SyntaxKind.FalseKeyword
    );
  }

  return false;
}

function renderJsxValue(value: DraftOverride['value'], wrapInExpression: boolean): string | null {
  if (typeof value === 'string') {
    const literal = JSON.stringify(value);
    return wrapInExpression ? `{${literal}}` : literal;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return `{${value}}`;
  }

  if (typeof value === 'boolean') {
    return `{${value}}`;
  }

  return null;
}

function toFailure(
  override: DraftOverride,
  code: SaveFailure['result']['code'],
  message: string
): SaveFailure {
  return {
    address: {
      sessionId: override.sessionId,
      instanceId: override.instanceId,
      path: override.path,
    },
    result: {
      ok: false,
      code,
      message,
    },
  };
}
