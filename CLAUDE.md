<!-- AGENTS.md é o padrão aberto lido por Codex, Cursor, Copilot, Gemini etc. Este arquivo só o importa, para manter uma única fonte de verdade. -->

@AGENTS.md

## Específico do Claude Code
- Para tarefas com mais de 3 passos ou que mexem em arquitetura/banco, use Plan mode e espere aprovação.
- Skills a preferir quando aplicável: `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `supabase` (se instalada), `frontend-design`.
- Use o MCP do Supabase para **ler** (list_tables, get_advisors, search_docs). `apply_migration` e `execute_sql` em projeto remoto só com aprovação; o fluxo padrão é migration local via CLI.
- Preferências pessoais/locais vão em `CLAUDE.local.md` e `.claude/settings.local.json` (fora do git).
