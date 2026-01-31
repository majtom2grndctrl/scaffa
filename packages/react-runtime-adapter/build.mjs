import { build } from "esbuild";
import { rmSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(__dirname, "dist");

// Clean dist
rmSync(distDir, { recursive: true, force: true });
mkdirSync(distDir, { recursive: true });

// Build ESM bundle
await build({
  entryPoints: [resolve(__dirname, "src/index.ts")],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2020",
  outfile: resolve(distDir, "index.js"),
  external: ["react", "react-dom", "react-router-dom"],
  jsx: "automatic",
  sourcemap: true,
});

console.log("✓ Built @skaffa/react-runtime-adapter");
