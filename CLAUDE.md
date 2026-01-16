# Agent Guidance

- Use docs/index.md as the architectural source of truth.
- Keep the Electron multi-process model and renderer tech stack aligned with the plan.

## Working on Beads Tickets

When asked to work on a beads ticket, use the `implement-ticket` skill. It provides a complete workflow including:
- Documentation grounding and validation
- Systematic implementation with todo tracking
- Full landing protocol (commit, sync, push)

## General Work Guidance

For any significant code changes (even when not working on a formal ticket):

1. **Ground on documentation first** - Review relevant docs before coding
2. **Validate documentation after** - Check for and fix outdated/misleading docs
3. **Complete landing protocol**:
   ```bash
   git add <files>
   git commit -m "..."
   bd sync
   git push
   ```

Work is NOT complete until pushed to remote.
