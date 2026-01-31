import { describe, it, expect } from "vitest";

// Minimal copy of the runner.js export wrapper to validate output behavior.
function wrapExportWithBoundary(
  code: string,
  typeId: string,
  exportName: string,
  moduleId: string,
): string {
  const isDefaultExport = exportName === "default";

  if (isDefaultExport) {
    const defaultFuncMatch = code.match(
      /export\s+default\s+(function|class)\s+(\w+)?/,
    );
    if (defaultFuncMatch) {
      const keyword = defaultFuncMatch[1];
      const name = defaultFuncMatch[2] || "_SkaffaWrappedComponent";
      return `
import { SkaffaInstanceBoundary as _SkaffaInstanceBoundary } from '@skaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+(function|class)/, `const ${name} = ${keyword}`)}

export default _SkaffaInstanceBoundary(${name}, ${JSON.stringify(typeId)});
`;
    }

    const defaultExprMatch = code.match(/export\s+default\s+(\w+)\s*;?/);
    if (defaultExprMatch) {
      const identifier = defaultExprMatch[1];
      return `
import { SkaffaInstanceBoundary as _SkaffaInstanceBoundary } from '@skaffa/react-runtime-adapter';

${code.replace(/export\s+default\s+\w+\s*;?/, "")}

const _OriginalComponent = ${identifier};
export default _SkaffaInstanceBoundary(_OriginalComponent, ${JSON.stringify(typeId)});
`;
    }
  } else {
    const namedFuncPattern = new RegExp(
      `export\\s+(function|class)\\s+${exportName}\\b`,
    );
    const namedFuncMatch = code.match(namedFuncPattern);
    if (namedFuncMatch) {
      const keyword = namedFuncMatch[1];
      const originalName = `_Original${exportName}`;
      const wrappedName = `_SkaffaWrapped${exportName}`;
      return `
import { SkaffaInstanceBoundary as _SkaffaInstanceBoundary } from '@skaffa/react-runtime-adapter';
import { createElement as _SkaffaCreateElement } from 'react';

${code.replace(namedFuncPattern, `${keyword} ${originalName}`)}

const ${wrappedName} = _SkaffaInstanceBoundary(${originalName}, ${JSON.stringify(typeId)});
export function ${exportName}(props) {
  return _SkaffaCreateElement(${wrappedName}, props);
}
`;
    }

    const namedVarPattern = new RegExp(
      `export\\s+(const|let|var)\\s+${exportName}\\b`,
    );
    if (namedVarPattern.test(code)) {
      const originalName = `_Original${exportName}`;
      return `
import { SkaffaInstanceBoundary as _SkaffaInstanceBoundary } from '@skaffa/react-runtime-adapter';

${code.replace(namedVarPattern, `const ${originalName}`)}

export const ${exportName} = _SkaffaInstanceBoundary(${originalName}, ${JSON.stringify(typeId)});
`;
    }

    const namedExportPattern = new RegExp(
      `export\\s*\\{[^}]*\\b${exportName}\\b[^}]*\\}`,
    );
    const match = code.match(namedExportPattern);
    if (match) {
      const exportBlock = match[0];
      const contentMatch = exportBlock.match(/\{([^}]*)\}/);
      if (!contentMatch) return code;

      const content = contentMatch[1];
      const parts = content
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      let localName = null;
      const newParts = parts.map((part) => {
        // Case 1: "Button" (shorthand)
        if (part === exportName) {
          localName = exportName;
          return `_SkaffaWrapped${exportName} as ${exportName}`;
        }
        // Case 2: "Local as Button" (aliased)
        const asMatch = part.match(/^(\w+)\s+as\s+(\w+)$/);
        if (asMatch && asMatch[2] === exportName) {
          localName = asMatch[1];
          return `_SkaffaWrapped${exportName} as ${exportName}`;
        }
        return part;
      });

      if (localName) {
        const newExportBlock = `export { ${newParts.join(", ")} }`;
        const wrappedName = `_SkaffaWrapped${exportName}`;

        return `
import { SkaffaInstanceBoundary as _SkaffaInstanceBoundary } from '@skaffa/react-runtime-adapter';

${code.replace(
  namedExportPattern,
  `
const ${wrappedName} = _SkaffaInstanceBoundary(${localName}, ${JSON.stringify(typeId)});
${newExportBlock}
`,
)}
`;
      }
    }
  }

  return code;
}

describe("Vite launcher instrumentation transform", () => {
  it("keeps named function exports hoisted to avoid TDZ in cycles", () => {
    const source = `
import React from 'react';

export function DemoButton() {
  return <button>Click</button>;
}
`;

    const output = wrapExportWithBoundary(
      source,
      "demo.button",
      "DemoButton",
      "/demo/app/src/components/DemoButton.tsx",
    );

    expect(output).toContain("export function DemoButton");
    expect(output).not.toContain("export const DemoButton");
    expect(output).toContain("const _SkaffaWrappedDemoButton");
    expect(output).toContain(
      "return _SkaffaCreateElement(_SkaffaWrappedDemoButton, props);",
    );
  });

  it("instruments re-exports (Shadcn UI pattern)", () => {
    const source = `
import * as React from "react"
const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  return <button ref={ref} {...props} />
})
Button.displayName = "Button"

export { Button, buttonVariants }
`;

    const output = wrapExportWithBoundary(
      source,
      "ui.button",
      "Button",
      "/demo/app/src/components/ui/button.tsx",
    );

    expect(output).toContain("_SkaffaInstanceBoundary");
    expect(output).toContain(
      'const _SkaffaWrappedButton = _SkaffaInstanceBoundary(Button, "ui.button")',
    );
    expect(output).toContain(
      "export { _SkaffaWrappedButton as Button, buttonVariants }",
    );
  });

  it("instruments export const (Layout primitives pattern)", () => {
    const source = `
import React from 'react';
export const Box: React.FC<BoxProps> = (props) => {
  return <div />;
};
`;

    const output = wrapExportWithBoundary(
      source,
      "layout.box",
      "Box",
      "/path/to/Box.tsx",
    );

    expect(output).toContain("_SkaffaInstanceBoundary");
    expect(output).toContain("const _OriginalBox");
    expect(output).toContain(
      'export const Box = _SkaffaInstanceBoundary(_OriginalBox, "layout.box")',
    );
  });
});
