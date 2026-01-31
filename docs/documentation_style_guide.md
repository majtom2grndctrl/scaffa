# Documentation Style Guide

Write docs like Hemingway wrote prose. Short sentences. Clear words. No waste.

## Principles

**Be direct.** State facts. Skip modifiers.

**Be active.** "Inspector renders controls" not "Controls are rendered by inspector."

**Be concrete.** Show structure, not concepts. Give paths, not descriptions.

**Be brief.** One idea per sentence. One purpose per paragraph.

## Before/After Examples

### Example 1: Wordy explanation

**Before:**
```
The renderer is built using shadcn/ui components with custom design
tokens that are defined in the src/renderer/styles.css file. The
interface provides a polished, accessible experience using semantic
color utilities that ensure consistency across all components.
```

**After:**
```
Renderer uses shadcn/ui components. Theme tokens in src/renderer/styles.css.
```

### Example 2: Passive voice

**Before:**
```
Preview sessions are used to represent different runtime contexts.
The app session is rendered by attaching to a dev server, and the
component session is rendered via the harness launcher.
```

**After:**
```
Preview sessions represent runtime contexts. App session attaches
to dev server. Component session uses harness launcher.
```

### Example 3: Abstract concepts

**Before:**
```
The multi-process architecture leverages Electron's IPC capabilities
to create a secure, isolated boundary between the renderer and main
processes that enables safe communication while maintaining strong
separation of concerns.
```

**After:**
```
Renderer sends IPC via preload. Main handles requests. Extension
host runs modules in isolated process.
```

### Example 4: Redundant explanations

**Before:**
```
## State Management

The renderer uses Zustand for state management. There are several
main stores:

- graphStore: This store manages the project graph including routes,
  components, and instances that are tracked during the session.
- inspectorStore: This store is responsible for managing inspector-related
  state such as the selected instance and property overrides that
  the user creates.
```

**After:**
```
## State

- graphStore (Zustand): routes, components, instances.
- inspectorStore (Zustand): selection, overrides.
```

## Lists and Structure

**Use fragments, not full sentences:**
- Good: "Routes, components, instance hierarchy"
- Bad: "This system handles routes, components, and manages the instance hierarchy"

**Use colons to separate what from detail:**
- Good: "graphStore: routes, components, instances"
- Bad: "The graphStore contains routes, components, and instance information"

**Drop articles (a, an, the) in lists:**
- Good: "Inspector shows editable props"
- Bad: "The inspector shows the editable props"

## Section Headers

Keep headers short. Use nouns, not questions.

- Good: "Setup", "IPC Protocol", "Extension API"
- Bad: "How to Set Up", "What is the IPC Protocol", "Extension API Architecture"

## Code and Paths

Prefer file references over code samples. Code is the source of truth.

**File structure:**
```
src/
  main/        # Main process (Electron host)
  renderer/    # Workbench UI
  extension-host/  # Extension module runtime
  preload/     # IPC gateway
```

Not: "The src directory contains a main folder for the main process, a renderer folder that houses the workbench UI, and an extension-host folder for running extension modules."

**Reference actual code:**
```
Graph updates: src/main/graph/graph-store.ts:45
PropOverride type: src/shared/override.ts:12
IPC validation: src/main/ipc/workspace.ts:28
```

Not:
```typescript
// Example code that will go stale
function updateGraph(node: Node) {
  store.update(node);
}

interface PropOverride {
  instanceId: string;
  propPath: string[];
  value: unknown;
  timestamp: number;
}
```

**Exception: Specs for unbuilt features**
```typescript
// Proposed design
interface HarnessConfig {
  entry: string;
  providers: Provider[];
}
```

**Describe implementations in prose:**
```
IPC handler validates payload with Zod, calls graphStore.updateNode(),
returns updated snapshot.
```

**Commands:**
Show the command. Skip the explanation if clear.
```bash
pnpm dev
```

Not: "To start the development server, run the pnpm dev command."

## When to Break Rules

Add detail for:
- Security concerns
- Non-obvious behavior
- Setup requirements
- Cross-process boundaries

Keep the style direct even when adding detail.

**Good detailed explanation:**
```
TypeScript strict mode on. Extension host runs in separate process.
Modules never import from src/main/ or src/renderer/. All access
via ExtensionContext API.
```

**Bad detailed explanation:**
```
This project uses TypeScript's strict mode, which is enabled in
the configuration. The extension host architecture runs modules in
a separate process, which means that extension modules should never
import code from the src/main/ or src/renderer/ directories because
they need to access capabilities through the ExtensionContext API.
```
