## 1. What Scaffa Is

Scaffa is an **Integrated Design Environment (IDE) for web-based software**.

It helps designers and engineers shape *real, production UI* by making structure **visible, editable, and safe to explore**, without hiding or replacing the underlying code.

Scaffa is not:
- a visual website builder
- a code generator that replaces engineers
- a design tool that outputs throwaway artifacts

Scaffa is:
- an editor that operates directly on production systems
- a structured environment for "vibe coding" with guardrails
- a bridge between design intent and implementation reality

---

## 2. Architecture

See `docs/index.md` for the current architecture plan, process model, and contracts.

---

## 3. How It Works

- Instance-first editing: work on what exists on screen, not abstract component definitions
- Explicit editability: what can be edited is declared, reviewable, and configurable
- Inspector-style interaction: select an instance, view its properties, apply scoped changes
- Multiple synchronized views: preview, component tree, and route context stay aligned

---

## 4. Configuration and Safety

Engineers define configuration that declares:
- which components and instances are editable
- which properties are exposed and how they are edited
- safe boundaries and escape hatches to raw code

Changes are previewed, reversible, and always traceable to source locations.

---

## 5. Modularity and AI

Scaffa is a small core plus modules. Modules can add component libraries, edit affordances, preview context, and workflows. AI is optional, constrained, and always produces reviewable output.

---

## 6. What Scaffa Avoids

Scaffa does not attempt to:
- replace programming languages
- eliminate architectural decisions
- guess intent without context
- make all systems editable by default

Constraint is a feature, not a limitation.

---

## 7. Testing

See `docs/testing_guide.md` for Scaffa’s testing philosophy, what to prioritize, and how tests should document system behavior for AI agents.

### Running Tests

```bash
pnpm test
pnpm test:ui
pnpm test:coverage
pnpm test:e2e
pnpm prepush
```

**Note:** E2E tests require the app to be built first (`pnpm build`). If not built, E2E tests will be skipped with a helpful message.

---

## 8. Guiding Statement

**Scaffa is an environment for shaping real software through visible structure, explicit boundaries, and confident iteration—without severing the link to code.**
