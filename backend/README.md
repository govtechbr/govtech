# backend — Supabase

Banco Postgres, autenticação e regras de acesso (RLS) do GovTech MS. Projeto Supabase: **`govtech-br`** (região São Paulo).

```
supabase/
├── migrations/   SQL versionado: a fonte da verdade do banco
├── seed.sql      organização de demonstração com os projetos do mock
├── tests/        testes pgTAP das regras de acesso
└── scripts/      to_sql_editor.py: prepara um teste para o SQL Editor
```

## Como as mudanças chegam ao banco (sem Docker)

Decisão de 01/11/2026 (`docs/PLANO_TECNICO.md` §16):

1. A mudança é escrita como **nova migration** em `supabase/migrations/` (`AAAAMMDDHHMMSS_nome.sql`) e revisada no PR.
2. Com **aprovação explícita** do dono do projeto, é aplicada no `govtech-br` pelo MCP do Supabase (`apply_migration`). **Nunca** pelo painel.
3. Depois de aplicar, roda-se o **Security Advisor** e os **testes pgTAP** (`tests/*.test.sql`). Os testes rodam numa transação que termina em `ROLLBACK`, então não deixam dados no banco.

Migration aplicada não é editada: correção é sempre uma migration nova.

## Como rodar os testes pgTAP (sem Docker)

O SQL Editor do Supabase analisa o script inteiro antes de executar, então o arquivo de teste não roda nele como está. O script converte o teste num único bloco `DO`, que termina com um **erro proposital** mostrando o resultado; o erro desfaz tudo o que o teste criou, inclusive a extensão `pgtap`.

```bash
cd backend/supabase
python scripts/to_sql_editor.py tests/core_rls.test.sql core_rls.editor.sql
```

1. Cole o `core_rls.editor.sql` no SQL Editor do `govtech-br` e clique em **Run**.
2. A mensagem de erro começa com `RESULTADO DOS TESTES` e traz uma linha `ok N - …` por teste. Qualquer `not ok` é falha.
3. Não versione o arquivo gerado.

Resultado em 01/11/2026: **25/25 ok** (`core_rls.test.sql`), banco conferido vazio depois da execução.

## Regras (resumo do AGENTS.md)

- RLS ligada em **toda** tabela de `public`, uma policy por operação.
- Policies usam `(select auth.uid())`; colunas usadas em policy têm índice.
- Funções `security definer` ficam no schema `private`, com `set search_path = ''`. O front chama só os "embrulhos" em `public`.
- Toda policy nova tem teste pgTAP **positivo e negativo**.
- Visitante sem login (`anon`) não acessa nenhuma tabela.

## Seed de demonstração

`seed.sql` cria a organização "GovTech MS (demo)" com os 4 projetos do mock e põe uma conta existente como admin. Rodar **depois** do cadastro dessa conta no app, trocando `ADMIN_EMAIL_AQUI` pelo e-mail dela na hora de executar (o e-mail não fica no repositório).
