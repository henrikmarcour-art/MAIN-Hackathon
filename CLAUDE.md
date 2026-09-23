@AGENTS.md

## Claude Code specifics

The full project guide above comes from `AGENTS.md`, which Cursor and VS Code Copilot also read. Edit that file, not this one, for project knowledge.

- **Subagents** (`.claude/agents/`): `frontend-designer`, `supabase-expert`, `code-reviewer`, `pre-deploy-checker`, `github-sync`. Claude delegates to them automatically, or call one directly with `@agent-<name>`.
- **Workflows**: `/start-work`, `/new-feature <what to build>`, `/review-work`, `/pre-deploy`, `/end-work`. The older `/start123` and `/end123` still work.
- **Use `/review-work`, not `/review`.** `/review` is Claude Code's built-in code review and does not use this project's checklist.
- **Supabase MCP** (if connected): read-only queries are fine. Never apply migrations, grants or policies without the user's approval.
- **Long-running commands** (`npm run dev`, `build`, `lint`): tell the user before starting, use a timeout, and never leave hung background processes behind.
