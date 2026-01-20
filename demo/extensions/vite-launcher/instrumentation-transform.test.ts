import { describe, it, expect } from 'vitest';

// Minimal copy of the runner.js export wrapper to validate output behavior.
function wrapExportWithBoundary(
  code: string,
  typeId: string,
  exportName: string,
  moduleId: string
): string {
  const isDefaultExport = exportName === 'default';

  if (isDefaultExport) {
    const defaultFuncMatch = code.match(/export\s+default\s+(function|class)\s+(\w+)?/);
    if (defaultFuncMatch) {
      const keyword = defaultFuncMatch[1];
      const name = defaultFuncMatch[2] || '_ScaffaWrappedComponent';
      return `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+(function|class)/, `const ${name} = ${keyword}`)}

export default _ScaffaInstanceBoundary(${name}, ${JSON.stringify(typeId)});
`;
    }

    const defaultExprMatch = code.match(/export\s+default\s+(\w+)\s*;?/);
    if (defaultExprMatch) {
      const identifier = defaultExprMatch[1];
      return `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+\w+\s*;?/, '')}

const _OriginalComponent = ${identifier};
export default _ScaffaInstanceBoundary(_OriginalComponent, ${JSON.stringify(typeId)});
`;
    }
  } else {
    const namedFuncPattern = new RegExp(`export\\s+(function|class)\\s+${exportName}\\b`);
    const namedFuncMatch = code.match(namedFuncPattern);
    if (namedFuncMatch) {
      const keyword = namedFuncMatch[1];
      const originalName = `_Original${exportName}`;
      const wrappedName = `_ScaffaWrapped${exportName}`;
      return `
import { ScaffaInstanceBoundary as _ScaffaInstanceBoundary } from '@scaffa/react-runtime-adapter';
import { createElement as _ScaffaCreateElement } from 'react';

${code.replace(namedFuncPattern, `${keyword} ${originalName}`)}

const ${wrappedName} = _ScaffaInstanceBoundary(${originalName}, ${JSON.stringify(typeId)});
export function ${exportName}(props) {
  return _ScaffaCreateElement(${wrappedName}, props);
}
`;
    }

    const namedExportPattern = new RegExp(`export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`);
    if (namedExportPattern.test(code)) {
      return code;
    }
  }

  return code;
}

describe('Vite launcher instrumentation transform', () => {
  it('keeps named function exports hoisted to avoid TDZ in cycles', () => {
    const source = `
import React from 'react';

export function DemoButton() {
  return <button>Click</button>;
}
`;

    const output = wrapExportWithBoundary(
      source,
      'demo.button',
      'DemoButton',
      '/demo/app/src/components/DemoButton.tsx'
    );

    expect(output).toContain('export function DemoButton');
    expect(output).not.toContain('export const DemoButton');
    expect(output).toContain('const _ScaffaWrappedDemoButton');
    expect(output).toContain('return _ScaffaCreateElement(_ScaffaWrappedDemoButton, props);');
  });
});
