---
name: start-work
description: Start a MaasNow work session — check git state, safely pull the latest main, and summarize where things stand. Run only when the user invokes /start-work.
disable-model-invocation: true
---

Start a work session safely. Never overwrite or discard local work. (Claude Code: the `github-sync` agent can do the git steps.)

1. **Check state.** Run `git status`, `git branch --show-current` and `git stash list`.
   - If there are uncommitted changes, do **not** stash, reset or switch branches. List them and ask the user whether to continue on this branch, commit them, or stash them.
2. **Fetch.** `git fetch origin --prune`.
3. **Update.**
   - On `main` with a clean tree: `git pull --ff-only origin main`.
   - On a feature branch: report how many commits it is behind `origin/main`. Do not merge or rebase unless the user asks.
   - If a fast-forward is not possible: stop and explain. Do nothing else.
4. **Summarize in a few lines.**
   - Current branch.
   - Up to date or not.
   - Local changes, if any.
   - New commits from others since the last pull (`git log --oneline` of what came in), and whether they touched the shared files (`src/app/page.tsx`, `src/data/events.ts`, `src/app/globals.css`).
5. **Tell the user they can start.** Remind them to make changes on a branch: `/new-feature <what>` creates one.

Do not push, merge, delete branches or install dependencies. If `package.json` changed in the pulled commits, suggest running `npm install`.
