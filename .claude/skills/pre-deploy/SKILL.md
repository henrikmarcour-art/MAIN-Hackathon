---
name: pre-deploy
description: Check whether the current MaasNow branch is ready to merge and deploy on Vercel — TypeScript, bounded build, env vars, Supabase assumptions, secrets. Read-only; ends with GO / NO-GO. Run only when the user invokes /pre-deploy.
disable-model-invocation: true
---

Decide whether this branch is safe to go live. Do not deploy, push, merge or change any settings.

1. **Run the checks.**
   - Claude Code: delegate to the `pre-deploy-checker` agent.
   - Other tools: open `.claude/agents/pre-deploy-checker.md` and run its checklist yourself.
2. **Before starting `npm run build`, tell the user.** Use a time limit and never leave a hung process running. On Henrik's Mac the local build may hang; then rely on the Vercel preview build.
3. **Report** one row per check (✅ / ⚠️ / ❌ / not verified), then **GO** or **NO-GO** with the blocking items and how to fix each. Anything not actually verified must say "not verified".
4. **If GO:** the next step is `/end-work` to push the branch, then merge the PR into `main` on GitHub (Henrik: "Create a merge commit"). Vercel deploys `main` automatically.
