import { describe, it, expect } from 'vitest';

function replaceEntryScript(html: string): string {
  const harnessSrc = '/.scaffa-harness.tsx';
  const scriptRegex = /<script\s+type="module"\s+src="([^"]+)"><\/script>/g;
  let replacedSrc: string | null = null;

  const nextHtml = html.replace(scriptRegex, (match, src: string) => {
    if (replacedSrc) {
      return match;
    }
    if (src.includes('/@vite/client')) {
      return match;
    }
    replacedSrc = src;
    return `<script type="module" src="${harnessSrc}"></script>`;
  });

  return replacedSrc ? nextHtml : html;
}

describe('Vite launcher harness transform', () => {
  it('replaces the app entry script but preserves the Vite client', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="root"></div>
          <script type="module" src="/@vite/client"></script>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `;

    const result = replaceEntryScript(html);

    expect(result).toContain('<script type="module" src="/@vite/client"></script>');
    expect(result).toContain('<script type="module" src="/.scaffa-harness.tsx"></script>');
    expect(result).not.toContain('<script type="module" src="/src/main.tsx"></script>');
  });

  it('replaces the only module script when no Vite client is present', () => {
    const html = `
      <!DOCTYPE html>
      <html>
        <head></head>
        <body>
          <div id="root"></div>
          <script type="module" src="/src/main.tsx"></script>
        </body>
      </html>
    `;

    const result = replaceEntryScript(html);

    expect(result).toContain('<script type="module" src="/.scaffa-harness.tsx"></script>');
    expect(result).not.toContain('<script type="module" src="/src/main.tsx"></script>');
  });
});
