# backend — Supabase

Banco Postgres, autenticação e regras de acesso (RLS) do GovTech MS. Projeto Supabase: **`govtech-br`** (região São Paulo).

```
supabase/
├── migrations/   SQL versionado: a fonte da verdade do banco
├── seed.sql      organização de demonstração com os projetos do mock
├── tests/        testes pgTAP das regras de acesso
├── functions/    Edge Functions (Deno, JavaScript): github
└── scripts/      to_sql_editor.py: prepara os testes para o SQL Editor
```

## Como as mudanças chegam ao banco (sem Docker)

Decisão de 01/11/2026 (`docs/PLANO_TECNICO.md` §16):

1. A mudança é escrita como **nova migration** em `supabase/migrations/` (`AAAAMMDDHHMMSS_nome.sql`) e revisada no PR.
2. Com **aprovação explícita** do dono do projeto, é aplicada no `govtech-br` pelo MCP do Supabase (`apply_migration`). **Nunca** pelo painel.
3. Depois de aplicar, roda-se o **Security Advisor** e os **testes pgTAP** (`tests/*.test.sql`). Os testes rodam numa transação que termina em `ROLLBACK`, então não deixam dados no banco.

Migration aplicada não é editada: correção é sempre uma migration nova.

**Quando o MCP recusa a migration:** a ferramenta pede uma confirmação que é recusada automaticamente quando o SQL contém `delete`/`update` (mesmo dentro de funções). Nesse caso, o dono do projeto cola o **arquivo versionado** no SQL Editor (nunca SQL escrito à mão no painel) e a versão é registrada em `supabase_migrations.schema_migrations` pelo MCP. Foi o caso da `github` (02/11/2026) e da `repository_selection` (03/11/2026).

## Edge Function `github`

Conecta a chave do GitHub de um projeto, lista o que ela enxerga, salva os repositórios escolhidos pelo admin, sincroniza e desconecta (`docs/PLANO_TECNICO.md` §18).

- `functions/github/index.js`: entrada (Deno). Confere o login e o papel do usuário **no banco** antes de agir; usa a chave de serviço (variável de ambiente do Supabase, nunca no front) só para o Vault e para gravar os dados.
- `functions/github/github.js`: conversa com a API do GitHub e converte as respostas. Sem dependência do Deno.
- `functions/github/score.js`: cálculo do **Índice de Governança** (regras I1–I6), puro. Depois de cada sincronização (manual ou do agendador), a função grava a nota do dia em `governance_scores`; na primeira apuração de um projeto, recalcula os dias anteriores desde o primeiro PR.
- Testes: `node --test "backend/supabase/functions/*/*.test.js"` (rodam no CI, junto com os da `assistant`).
- Publicação: pelo MCP do Supabase (`deploy_edge_function`), com aprovação. Versão 3 (04/11/2026): PRs com aprovações pela API GraphQL, commits e ação `sync-all`. Versão 4 (02/11/2026): Índice de Governança. Versão 5 (02/11/2026): reconstrução só a partir do primeiro PR. Versão 6 (02/11/2026): paginação G9 e eventos de auditoria (`audit_record`). Versão 8 (02/11/2026): status do CI (G10), publicada depois da migration `ci_status`. Versão 9 (02/11/2026): histórico de execuções do CI (G11), publicada depois da migration `ci_runs`.
- **`verify_jwt` desligado desde a versão 3:** o agendador (pg_cron) chama sem login, com a senha `github_cron_secret` do Vault no cabeçalho `x-cron-secret`. As outras ações conferem o login dentro da função (`auth.getUser`), como antes.
- **Agendamento:** job `github-sync-hourly` (`7 * * * *`) no pg_cron, criado pela migration `github_sync_hourly`. Ver os últimos disparos: `select * from cron.job_run_details order by start_time desc limit 5;` e as respostas em `net._http_response`.

## Edge Function `assistant`

Assistente de Governança com IA (`docs/REGRAS_DE_NEGOCIO.md` §5.2; contrato em `docs/API.md` §6.7).

- `functions/assistant/index.js`: entrada (Deno, `verify_jwt` ligado). Confere login e se a pessoa é membro da empresa, conta a pergunta com `assistant_consume` (20 por pessoa e 200 no total por dia) e pergunta ao Groq.
- `functions/assistant/prompt.js`: valida o pedido, remove dados pessoais do contexto e monta o prompt. Puro, testado com `node --test`.
- **Secret necessário:** `GROQ_API_KEY`, gravado pelo dono do projeto em Supabase → Edge Functions → Secrets. Nunca no git nem no chat. Sem ele, a função responde 503 "O assistente ainda não foi configurado".
- Conta do Groq com **Zero Data Retention** ligado (Data Controls).
- Publicação: pelo MCP do Supabase, `verify_jwt` ligado. Versão 1 (02/11/2026). Secret `GROQ_API_KEY` configurado em 02/11/2026; primeira pergunta real respondida (200). Versão 3 (02/11/2026): resposta sem negrito, data em Campo Grande e notas dos critérios explicadas no prompt.

## Como rodar os testes pgTAP (sem Docker)

O SQL Editor do Supabase analisa o script inteiro antes de executar, então o arquivo de teste não roda nele como está. O script converte os testes num único bloco `DO`: cada arquivo roda num sub-bloco que se desfaz sozinho, e um **erro proposital** no fim mostra o resultado de todos; o erro desfaz tudo o que os testes criaram, inclusive a extensão `pgtap`.

```bash
cd backend/supabase
python scripts/to_sql_editor.py tests/*.test.sql todos.editor.sql   # ou só um arquivo
```

1. Cole o `todos.editor.sql` no SQL Editor do `govtech-br` e clique em **Run**.
2. A mensagem de erro começa com `RESULTADO DOS TESTES` e traz, para cada arquivo, uma linha `# arquivo` e uma linha `ok N - …` por teste. Qualquer `not ok` é falha.
3. Não versione o arquivo gerado.

| Arquivo | Testes | Último resultado |
|---|---|---|
| `core_rls.test.sql` | 25 | 25/25 ok (03/11/2026, depois da migration `repository_selection`) |
| `members.test.sql` | 8 | 8/8 ok (03/11/2026) |
| `github.test.sql` | 15 | 15/15 ok (03/11/2026) |
| `repository_selection.test.sql` | 11 | 11/11 ok (03/11/2026) |
| `github_sync.test.sql` | 9 | 9/9 ok (04/11/2026; os 5 arquivos juntos: 68/68 ok) |
| `governance_scores.test.sql` | 6 | 6/6 ok (02/11/2026) |
| `assistant_usage.test.sql` | 8 | 8/8 ok (02/11/2026) |
| `audit_events.test.sql` | 19 | 19/19 ok (02/11/2026) |
| `ci_status.test.sql` | 7 | 7/7 ok (02/11/2026, pelo MCP) |
| `ci_runs.test.sql` | 6 | 6/6 ok (02/11/2026, pelo MCP) |

Depois de cada execução, o banco é conferido pelo MCP: nenhum usuário `@test.local` nem a extensão `pgtap` ficam para trás.

## Regras (resumo do AGENTS.md)

- RLS ligada em **toda** tabela de `public`, uma policy por operação.
- Policies usam `(select auth.uid())`; colunas usadas em policy têm índice.
- Funções `security definer` ficam no schema `private`, com `set search_path = ''`. O front chama só os "embrulhos" em `public`.
- Toda policy nova tem teste pgTAP **positivo e negativo**.
- Visitante sem login (`anon`) não acessa nenhuma tabela.

## Seed de demonstração

`seed.sql` cria a organização "GovTech MS (demo)" com os 4 projetos do mock e põe uma conta existente como admin. Rodar **depois** do cadastro dessa conta no app, trocando `ADMIN_EMAIL_AQUI` pelo e-mail dela na hora de executar (o e-mail não fica no repositório).
