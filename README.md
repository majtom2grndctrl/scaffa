## 1. What Scaffa Is

Scaffa is an **Integrated Design Environment (IDE) for web‑based software**.

It is designed to help designers and engineers collaboratively shape *real, production UI* by making complex systems **visible, editable, and safe to explore**, without hiding or replacing the underlying code.

Scaffa is not:
- a visual website builder
- a code generator that replaces engineers
- a design tool that outputs throwaway artifacts

Scaffa *is*:
- an editor that operates directly on production systems
- a structured environment for “vibe coding” with guardrails
- a bridge between design intent and implementation reality

---

## 2. Core Philosophy

### 2.1 Structure Without Rigidity

Scaffa provides structure where it helps understanding and safety, but avoids imposing a single methodology.

- It reveals existing structure instead of inventing new abstractions
- It allows teams to opt into deeper structure over time
- It preserves escape hatches to raw code at every layer

### 2.2 Instance‑First Thinking

Scaffa treats **instances of UI** as the primary object of interaction.

- Designers work with *what exists on screen*, not abstract component definitions
- Editing begins with concrete outcomes
- Type‑level authoring is a later, optional capability

This mirrors how people reason visually and aligns with game‑engine editor paradigms.

### 2.3 Explicit Editability

Nothing is editable by accident.

- What can be edited is *declared*, not inferred
- Editability is intentional, reviewable, and configurable
- Non‑editable elements are still inspectable and explorable

This preserves trust in the system and prevents accidental architectural damage.

### 2.4 Designers + Engineers, Not Designers vs Engineers

Scaffa assumes:
- engineers define safe boundaries and configuration
- designers operate confidently within those boundaries
- both share visibility into what is happening

Scaffa is collaborative infrastructure, not a role‑replacement tool.

---

## 3. The Mental Model

Scaffa borrows its interaction philosophy from **game engine editors** rather than traditional design tools.

Key characteristics:
- Multiple synchronized views of the same underlying system
- Clear separation between runtime output and editable representation
- Inspector‑style editing of selected entities
- Strong sense of “what exists” vs “what is being simulated”

The user does not manipulate files directly by default—they manipulate *meaningful representations* that are backed by real files.

---

## 4. Core Surfaces (Conceptual, Not Technical)

### 4.1 Preview Surface

Shows a live or simulated rendering of the application.

Responsibilities:
- Provide visual context
- Support selection of UI instances
- Reflect changes immediately

The preview is authoritative for *what the user sees*, not for *how it is implemented*.

### 4.2 Component Tree

Represents the structural composition of the UI.

Responsibilities:
- Reveal hierarchy and relationships
- Enable navigation and selection
- Act as a bridge between visual output and conceptual structure

### 4.3 Routes / Navigation View

Represents application‑level structure.

Responsibilities:
- Show navigational organization
- Allow users to understand scope and context
- Ground UI instances in application flow

### 4.4 Inspector

The primary editing surface.

Responsibilities:
- Display properties of the selected instance
- Clearly distinguish:
  - editable values
  - inspect‑only values
  - opaque values
- Apply changes safely and reversibly

Inspector edits are **instance‑scoped**, non‑destructive, and observable.

---

## 5. Configuration as a First‑Class Concept

Scaffa relies on **explicit configuration authored by engineers**.

Configuration defines:
- which components exist
- which instances are editable
- which properties are exposed
- how editing should behave

This configuration is:
- code‑reviewable
- composable
- modular

It allows organizations to encode their design system knowledge into the tool itself.

---

## 6. Modularity and Extensibility

Scaffa is designed as a **small core plus modules**.

Modules may:
- describe component libraries
- define editing affordances
- provide preview context
- contribute workflows or prompts

Organizations are expected to author their own modules for internal systems.

Scaffa’s core responsibility is to provide:
- stable extension points
- clear boundaries
- predictable behavior

---

## 7. AI as an Assistive Layer

AI in Scaffa is:
- optional
- constrained
- inspectable

Primary roles:
- accelerate repetitive tasks
- scaffold code the UI cannot yet author
- explain or summarize existing structure

AI never acts directly on the system without producing explicit, reviewable output.

---

## 8. Safety, Trust, and Reversibility

Every interaction in Scaffa must preserve trust.

Key principles:
- Changes are previewed before being committed
- Overrides can be reset or promoted intentionally
- Source locations are always visible
- Nothing is silently rewritten

Users should feel safe exploring without fear of breaking production systems.

---

## 9. What Scaffa Deliberately Avoids

Scaffa does not attempt to:
- replace programming languages
- eliminate architectural decisions
- guess intent without context
- make all systems editable by default

Constraint is a feature, not a limitation.

---

## 11. Testing

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

## 12. Guiding Statement

**Scaffa is an environment for shaping real software through visible structure, explicit boundaries, and confident iteration—without severing the link to code.**
