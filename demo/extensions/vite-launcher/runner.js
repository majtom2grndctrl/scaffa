// demo/extensions/vite-launcher/runner.ts
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
var require2 = createRequire(import.meta.url);
async function main() {
  const workspaceRoot = process.env.SCAFFA_ROOT || process.cwd();
  const entry = process.env.SCAFFA_ENTRY;
  const styles = JSON.parse(process.env.SCAFFA_STYLES || "[]");
  if (!entry) {
    console.error("[ViteRunner] Error: SCAFFA_ENTRY not set");
    process.exit(1);
  }
  console.log("[ViteRunner] Starting with config:", { entry, styles, workspaceRoot });
  try {
    const vitePath = require2.resolve("vite", { paths: [workspaceRoot] });
    const viteModule = await import(pathToFileURL(vitePath).href);
    const vite = viteModule.default || viteModule;
    const projectConfig = await vite.loadConfigFromFile(
      { command: "serve", mode: "development" },
      void 0,
      workspaceRoot
    );
    const harnessPlugin = {
      name: "scaffa:harness",
      enforce: "pre",
      // Run before other plugins to intercept index.html
      resolveId(id) {
        if (id === "/@scaffa/harness.tsx") {
          return "\0" + id;
        }
        return null;
      },
      load(id) {
        if (id === "\0/@scaffa/harness.tsx") {
          return `
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ScaffaProvider } from '@scaffa/react-runtime-adapter';

// User Styles
${styles.map((s) => `import ${JSON.stringify(s)};`).join("\n")}

// User Entry
import * as UserEntry from ${JSON.stringify(entry)};
const App = UserEntry.App || UserEntry.default;

// TODO: Implement preview.decorators support (ThemeProvider, RouterProvider, etc.)

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <ScaffaProvider
      config={{
        adapterId: 'react',
        adapterVersion: '0.1.0',
        debug: true, // TODO: Make configurable
      }}
    >
      {App ? <App /> : <div style={{color: 'red', padding: '20px'}}>Error: No App or default export found in ${JSON.stringify(entry)}</div>}
    </ScaffaProvider>
  </React.StrictMode>
);
          `;
        }
        return null;
      },
      transformIndexHtml(html) {
        return html.replace(
          /<script\s+type="module"\s+src="[^"]+"><\/script>/,
          '<script type="module" src="/@scaffa/harness.tsx"></script>'
        );
      }
    };
    const myConfig = {
      root: workspaceRoot,
      server: {
        port: 0,
        // Random port
        strictPort: true
      },
      plugins: [harnessPlugin],
      // Ensure we optimize our harness dependencies if needed
      optimizeDeps: {
        include: ["react", "react-dom/client", "@scaffa/react-runtime-adapter"]
      }
    };
    const finalConfig = vite.mergeConfig(projectConfig?.config || {}, myConfig);
    const server = await vite.createServer(finalConfig);
    await server.listen();
    const address = server.httpServer?.address();
    const port = typeof address === "object" && address ? address.port : 0;
    console.log(`Local: http://localhost:${port}`);
    await new Promise(() => {
    });
  } catch (error) {
    console.error("[ViteRunner] Failed to start:", error);
    process.exit(1);
  }
}
main();
