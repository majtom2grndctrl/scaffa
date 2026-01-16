# Scaffa Runtime Adapter Integration Guide (v0)

> **Status:** Draft / v0 guide  
> **Audience:** App/framework engineers integrating preview runtimes with Scaffa  
> **Goal:** Provide a single, end-to-end “recipe” for enabling click-to-select and non-destructive overrides in a preview runtime, aligned with the runtime adapter contract.

Related:
- [Architecture Plan](./index.md)
- [Scaffa Preview Session Protocol](./scaffa_preview_session_protocol.md)
- [Scaffa Runtime Adapter Contract](./scaffa_runtime_adapter_contract.md)
- [Scaffa Override Model + Persistence](./scaffa_override_model.md)

---

## 1. Mental Model

In v0, the runtime adapter is responsible for three things inside the preview runtime:
- Instance identity (what instance is this?)
- Click-to-select (which instance did the user click?)
- Override application (apply/clear prop overrides without rewriting source)

For React preview runtimes in this repo, those responsibilities are implemented by `packages/react-runtime-adapter`.

Editor View interaction policy (v0):
- Scaffa uses the embedded runtime as an editor canvas: click-to-select is the default.
- Clicks are consumed for selection (app navigation/handlers should not fire in the editor session).

### 1.1 Production Compatibility (Recommended)

Scaffa integration should not be required for your app to build and run in production.

Recommended approach:
- Keep Scaffa runtime instrumentation **dev-only** (or Scaffa-only) via a small project-local shim module.
- In production builds, the shim exports **no-op** implementations so your app runs normally without Scaffa.
- In Scaffa-enabled dev builds, the shim re-exports the real adapter from `@scaffa/react-runtime-adapter`.
- Keep Scaffa-specific packages in `devDependencies` and ensure production build entrypoints do not import `@scaffa/*` modules.

This lets Scaffa work against real app code without making Scaffa a production dependency.

---

## 2. The Three-Part Recipe (React)

All three parts are required.

### 2.1 Wrap the app root with `ScaffaProvider`

Configure the adapter and install its event wiring:

```tsx
import { ScaffaProvider } from './scaffa-runtime';

export function Root() {
  return (
    <ScaffaProvider config={{ adapterId: 'react', adapterVersion: 'v0', debug: false }}>
      <App />
    </ScaffaProvider>
  );
}
```

### 2.2 Wrap each selectable instance with `ScaffaInstance`

Mark a rendered subtree as a concrete instance of a stable component type:

```tsx
import { ScaffaInstance } from './scaffa-runtime';

export function DemoButton(props: DemoButtonProps) {
  return (
    <ScaffaInstance typeId="demo.button" displayName="Demo Button">
      <DemoButtonInner {...props} />
    </ScaffaInstance>
  );
}
```

Notes:
- `typeId` MUST match the component registry and (when present) the project graph.
- `ScaffaInstance` currently renders a wrapper element to attach identity attributes; ensure that wrapper does not break layout/styling.

### 2.3 Use `useScaffaInstance()` to apply overrides

Inside the instance subtree, replace incoming props with “effective” props:

```tsx
import { useScaffaInstance } from './scaffa-runtime';

function DemoButtonInner(props: DemoButtonProps) {
  const effectiveProps = useScaffaInstance(props);
  return <button>{effectiveProps.label}</button>;
}
```

If you forget this step, the Inspector can still emit overrides, but the preview won’t reflect them.

---

## 3. Common Pitfalls

- **`typeId` mismatch**: selection works, but Inspector lacks metadata (registry ↔ runtime mismatch).
- **Missing `useScaffaInstance()`**: overrides are sent, but rendered output never changes.
- **Incorrect preview URL**: preview sessions require a full URL with protocol (see `docs/scaffa_preview_session_protocol.md:30`).
- **Assuming Scaffa starts your dev server**: v0 preview targets are independent HTTP servers; you run them separately.

---

## Appendix: Project-Local Shim (Illustrative)

Create a small module in your app (e.g. `src/scaffa-runtime.ts`) and import Scaffa primitives from there throughout your codebase.

Then, switch that module between:
- **No-op exports** for production (and/or normal dev).
- **Real adapter exports** for Scaffa-enabled dev.

How you switch is toolchain-specific (Vite alias, conditional entrypoints, environment-flagged builds). The important invariant is:
- your production build must not require `@scaffa/*` packages to be installed.

---

## 4. Performance Notes (v0)

The React adapter recomputes “effective props” when overrides change. For small apps this is effectively instant.

If you see perf issues in larger apps:
- Prefer smaller prop objects and stable references where possible.
- Avoid passing large, deeply nested objects through `useScaffaInstance()` unless you expect to override them.
- Consider limiting which components are wrapped as instances during early integration.
