---
name: new-feature
description: Build a scoped MaasNow feature or fix — inspect the relevant code first, work on a feature branch, make minimal changes, and verify only what is relevant. Run only when the user invokes /new-feature.
argument-hint: <what you want to build or fix>
disable-model-invocation: true
---

The request: $ARGUMENTS

1. **Understand it.** If the request is empty or ambiguous, ask one short question before doing anything.
2. **Inspect first.**
   - Read `AGENTS.md` and the code the change touches. Find where the behavior lives now and how data flows into it.
   - UI work: read `docs/DESIGN_SYSTEM.md` (Claude Code: use the `frontend-designer` agent).
   - Database or Supabase work: use the `supabase` skill (Claude Code: the `supabase-expert` agent).
3. **Branch.**
   - If on `main`, make sure it is up to date (as in `/start-work`), then `git switch -c feat/<short-topic>` (use `fix/` for bug fixes).
   - If already on a feature branch, ask whether to continue on it.
   - Never create the branch on top of uncommitted work you did not make; ask first.
4. **Plan briefly.** List the files you will change in 2–5 bullets. **Stop and ask for approval** if the plan touches the Supabase schema/grants/policies, Vercel settings, dependencies, or a shared hot file in a large way.
5. **Implement the smallest change** that fully solves the request. No unrelated refactors, renames or formatting.
6. **Verify only what is relevant.**
   - Always: `npx tsc --noEmit`.
   - UI: check in a browser at 390 px and desktop width, or say it was not checked.
   - Supabase: test with the anon key.
   - Build: only with a time limit (see Known issues in `AGENTS.md`).
7. **Report.** Files changed, what was verified and what was not, and the next step (`/review-work`, then `/end-work`). Do not commit unless the user asks.
