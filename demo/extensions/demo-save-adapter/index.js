// ─────────────────────────────────────────────────────────────────────────────
// Demo Save Adapter (v0)
// ─────────────────────────────────────────────────────────────────────────────
// Promotes draft overrides into edits for demo/app/src/App.tsx.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as ts from 'typescript';

const APP_ENTRY = 'app/src/App.tsx';

const COMPONENT_NAME_BY_TYPE = {
  'demo.button': 'DemoButton',
  'demo.card': 'DemoCard',
};

export function activate(context) {
  console.log('[DemoSaveAdapter] Activating...');

  const promoter = {
    id: 'demo-save-adapter',
    displayName: 'Demo Save Adapter',
    promote: async (overrides) => {
      return buildSavePlan(context, overrides);
    },
  };

  context.save.registerPromoter(promoter);
  console.log('[DemoSaveAdapter] Registered');
}

export function deactivate() {
  console.log('[DemoSaveAdapter] Deactivated');
}

async function buildSavePlan(context, overrides) {
  if (!context.workspaceRoot) {
    return {
      edits: [],
      failed: overrides.map((override) =>
        toFailure(override, 'internalError', 'Workspace root is not available.')
      ),
    };
  }

  const appPath = join(context.workspaceRoot, APP_ENTRY);
  let sourceText;
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
  const textEdits = [];
  const failed = [];

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

  const edits = [
    {
      kind: 'text',
      filePath: APP_ENTRY,
      edits: textEdits,
    },
  ];

  return { edits, failed };
}

function collectJsxElements(sourceFile) {
  const elements = new Map();

  const visit = (node) => {
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

function parseRenderIndex(locator) {
  if (!locator || typeof locator !== 'object') {
    return { ok: false, message: 'Missing instance locator metadata.' };
  }

  const kind = locator.kind;
  const index = locator.index;

  if (kind !== 'renderIndex' || typeof index !== 'number' || index < 0) {
    return { ok: false, message: 'Unsupported instance locator format.' };
  }

  return { ok: true, index };
}

function parsePropName(path) {
  if (!path.startsWith('/')) {
    return null;
  }

  const parts = path.slice(1).split('/');
  if (parts.length !== 1) {
    return null;
  }

  return parts[0] || null;
}

function findAttribute(element, propName) {
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

function buildAttributeEdit(sourceFile, attribute, value) {
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

function isSupportedInitializer(initializer) {
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

function renderJsxValue(value, wrapInExpression) {
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

function toFailure(override, code, message) {
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
