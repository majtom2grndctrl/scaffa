# Agent Guidance

- Use docs/index.md as the architectural source of truth.
- Keep the Electron multi-process model and renderer tech stack aligned with the plan.

## Working on Beads Tickets

When asked to work on a beads ticket, use the `implement-ticket` skill.

## General Work Guidance

For any significant code changes (ticket or not):

1. **Ground on documentation first** - Review relevant docs before coding
2. **Validate documentation after** - Check for and fix outdated/misleading docs
3. **Complete landing protocol** - Always finish with:
   - `git add` + `git commit`
   - `bd sync`
   - `git push`
   - Verify `git status` shows "up to date"

Work is NOT complete until pushed to remote.
