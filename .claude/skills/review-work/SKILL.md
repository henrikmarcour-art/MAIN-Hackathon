---
name: review-work
description: Review the current MaasNow changes for bugs, security issues, UX regressions and unnecessary changes. Read-only. Run only when the user invokes /review-work.
disable-model-invocation: true
---

Review the current work. Do not edit files, commit or push.

1. **Collect the changes.** `git diff main...HEAD` (branch changes) plus `git diff` and `git diff --cached` (uncommitted changes). If there are no changes, say so and stop.
2. **Run the review.**
   - Claude Code: delegate to the `code-reviewer` agent.
   - Other tools: open `.claude/agents/code-reviewer.md` and follow its checklist yourself.
3. **Report the findings,** most severe first, each with `file:line`, what breaks and the fix. End with one line: ready for `/end-work`, or what must be fixed first.
4. **Offer to fix the findings,** but only change code if the user says yes.
