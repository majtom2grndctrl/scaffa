# Implement Beads Ticket

Implement a Beads ticket with documentation grounding and correction workflow.

## Usage

```
/implement-ticket <ticket-id>
```

Example: `/implement-ticket scaffa-7iq.11`

## What This Skill Does

This skill guides you through implementing a Beads ticket with proper workflow:

1. **Retrieves ticket details** - Shows the ticket description, acceptance criteria, and dependencies
2. **Grounds on documentation** - Reviews relevant architectural docs before starting work
3. **Implements the solution** - Works through the ticket requirements systematically
4. **Validates documentation** - Checks for and corrects any outdated or misleading docs
5. **Completes landing protocol** - Commits, syncs, and pushes all changes

## Instructions

You MUST follow these steps in order:

### Phase 1: Preparation

1. **Retrieve ticket details**:
   ```bash
   bd show <ticket-id>
   ```
   - Read the full description, acceptance criteria, and context
   - Note any dependencies or related tickets
   - Understand the scope before proceeding

2. **Claim the ticket**:
   ```bash
   bd update <ticket-id> --status=in_progress
   ```

3. **Ground on relevant documentation**:
   - **CRITICAL**: Before touching any code, identify which architectural documents are relevant to this ticket
   - Read the relevant docs from `docs/` directory to understand:
     - Current architecture and design decisions
     - Existing patterns and conventions
     - Related systems and boundaries
   - Common docs to review:
     - `docs/index.md` - Main architecture reference
     - `docs/scaffa_extension_authoring_guide.md` - For extension-related work
     - `docs/scaffa_extension_api.md` - For extension API changes
     - `docs/scaffa_ipc_boundaries_and_sequences.md` - For IPC/process boundary work
     - Component-specific docs as relevant to the ticket
   - **If you don't have recent recall of these docs, you MUST read them now**
   - Take note of any information that might be outdated or unclear

### Phase 2: Implementation

4. **Create todo list** (if ticket has multiple subtasks):
   ```typescript
   TodoWrite({
     todos: [
       { content: "Subtask 1", status: "pending", activeForm: "Working on subtask 1" },
       { content: "Subtask 2", status: "pending", activeForm: "Working on subtask 2" },
       // ...
     ]
   })
   ```

5. **Implement the solution**:
   - Work through requirements systematically
   - Follow existing patterns and conventions from the docs
   - Update todo list as you progress
   - Run builds and tests as needed
   - Keep changes focused on the ticket scope

6. **Verify the implementation**:
   - Run `npm run build` to ensure TypeScript compiles
   - Test the changes if applicable
   - Verify acceptance criteria are met

### Phase 3: Documentation Validation

7. **Check for documentation issues**:
   - **CRITICAL**: Review the docs you read earlier
   - Ask yourself:
     - Did any documentation mislead you or contain incorrect information?
     - Did you find contradictions between docs?
     - Is anything now out of date due to your changes?
     - Are there missing docs for the patterns you used?

8. **Correct documentation** (if issues found):
   - Update any outdated or incorrect documentation
   - Add new documentation for new patterns or APIs
   - Ensure docs accurately reflect the current implementation
   - Commit doc fixes separately or with your implementation

### Phase 4: Landing Protocol

9. **Complete the landing protocol**:

   **MANDATORY WORKFLOW** - Work is NOT complete until pushed:

   ```bash
   # 1. Check what changed
   git status

   # 2. Stage code changes
   git add <files>

   # 3. Commit beads changes
   bd sync

   # 4. Commit code with descriptive message
   git commit -m "feat: description

   Detailed explanation of changes.

   Resolves <ticket-id>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

   # 5. Sync beads again (captures new changes)
   bd sync

   # 6. Push to remote
   git push

   # 7. Verify push succeeded
   git status  # MUST show "up to date with origin"
   ```

10. **Close the ticket**:
    ```bash
    bd close <ticket-id>
    ```

## Critical Rules

- **NEVER skip documentation grounding** - Reading relevant docs prevents implementing wrong patterns
- **NEVER skip documentation validation** - Keeping docs accurate saves future confusion
- **NEVER say "ready to push when you are"** - YOU must push as part of landing protocol
- **NEVER skip `bd sync`** - Beads changes must be persisted
- **NEVER include `.beads/issues.jsonl` in code commits** - It's managed by `bd sync`
- Work is NOT complete until `git push` succeeds and `git status` shows "up to date"

## Example Session

```
User: /implement-ticket scaffa-7iq.11

Assistant: Retrieves ticket scaffa-7iq.11:
  • Reads full context and acceptance criteria
  • Claims ticket with `bd update scaffa-7iq.11 --status=in_progress`
  
Assistant: Grounds on relevant documentation:
  • Reads docs/index.md for architecture overview
  • Reads docs/scaffa_extension_api.md for Extension Context types
  • Takes note: GraphProducer.initialize() shows Promise<unknown> with TODO
  
Assistant: Implements the solution:
  • Updates extension-context.ts to properly type initialize() as Promise<GraphSnapshot>
  • Removes TODO comment
  • Runs build - passes successfully
  
Assistant: Validates documentation:
  • Checks docs - no issues found related to this change
  • Implementation matches existing patterns
  
Assistant: Completes landing protocol:
  ```bash
  git status
  git add src/extension-host/extension-context.ts
  bd sync
  git commit -m "feat(extensions): type GraphProducer.initialize() as Promise<GraphSnapshot>"
  bd sync
  git push
  git status  # Shows "up to date with origin"
  ```
  
Assistant: Closes ticket:
  ```bash
  bd close scaffa-7iq.11
  ```
```

## Benefits

- **Prevents rework** - Documentation grounding ensures you implement the right patterns
- **Maintains quality** - Documentation validation keeps docs accurate and trustworthy
- **Complete workflow** - Nothing gets left behind (commits, syncs, pushes)
- **Audit trail** - All changes properly tracked in git and beads

## Notes

- The skill enforces the full workflow but remains flexible for ticket complexity
- Documentation grounding is required but the specific docs to read depend on the ticket
- Documentation validation may find nothing to fix - that's fine!
- Some tickets may warrant separate documentation commits, others can include docs with implementation
