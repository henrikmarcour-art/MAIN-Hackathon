---
name: end-work
description: Finish a MaasNow work session — review the diff, remove debug/temp files, check for secrets, commit with a clear message, push the current branch (never merge), and write a short handoff. Run only when the user invokes /end-work.
disable-model-invocation: true
---

Wrap up the session. Invoking `/end-work` is permission to **commit and push the current branch**. It is **not** permission to merge, push to `main`, force-push or delete branches. (Claude Code: the `github-sync` agent can do the git steps.)

1. **Inspect.** Run `git branch --show-current`, `git status` and `git diff`. Summarize the changes in 2–4 lines.
   - If there is nothing to commit and the branch is already pushed, say so and skip to step 7.
2. **Protect `main`.** If the current branch is `main`, stop. Suggest `git switch -c feat/<topic>` (uncommitted changes carry over) and ask before continuing.
3. **Clean up.** Look for leftovers added in this session:
   - `console.log` or `debugger` statements,
   - commented-out code,
   - temp or scratch files, logs, screenshots.

   Remove the ones you created. For anything you are not sure about, ask. Never delete files you did not create without asking.
4. **Check for secrets.**
   - No `.env*` file except `.env.example` may be staged.
   - Scan the diff for keys, tokens, passwords and `service_role`.
   - If anything is found, stop and tell the user. Do not commit it.
5. **Check TypeScript.** `npx tsc --noEmit` must pass. If it fails, stop and report.
6. **Commit and push.**
   - Stage files by name after reviewing `git status`; do not use `git add -A` blindly.
   - Commit with a clear message: a short summary line, then a body explaining what changed and why.
   - Push: `git push -u origin <current-branch>`. Never force.
7. **Handoff.** Keep it short:
   - Branch and commit hash, and the Vercel preview URL pattern (`maasnow-git-<branch>-henriks-team.vercel.app`).
   - What is done.
   - What was verified, and what was not.
   - What didn't work, so nobody retries it.
   - The next steps.
   - How to merge: open a PR into `main` on GitHub (Henrik merges with "Create a merge commit").
