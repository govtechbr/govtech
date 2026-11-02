-- =====================================================================
-- Testes pgTAP da migration ci_runs (regra G11): histórico de execuções do CI.
-- Roda numa transação que termina em ROLLBACK. Sem Docker, converter com
-- scripts/to_sql_editor.py e rodar no SQL Editor (backend/README.md).
--
-- Cenário:
--   Org A: carol (stakeholder), repositório com uma execução que falhou e a correção
--   Org B: dave (admin), sem acesso aos dados da Org A
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

-- ---------- dados de teste (como postgres, no papel da Edge Function) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000c', 'carol@test.local', '{"full_name":"Carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@test.local',  '{"full_name":"Dave"}');

insert into public.organizations (id, name, join_code) values
  ('10000000-0000-0000-0000-00000000000a', 'Org A', 'CODEA00001'),
  ('10000000-0000-0000-0000-00000000000b', 'Org B', 'CODEB00001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'stakeholder'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.repositories (id, organization_id, github_id, full_name, name, html_url) values
  ('30000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-00000000000a', 1, 'alice/repo-a', 'repo-a', 'https://github.com/alice/repo-a');

insert into public.ci_runs
  (repository_id, organization_id, github_run_id, run_number, workflow_name, event, head_branch,
   head_sha, status, conclusion, html_url, started_at, completed_at) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 60, 60, 'CI',
   'pull_request', 'fix/x', 'abc', 'completed', 'failure',
   'https://github.com/alice/repo-a/actions/runs/60', now() - interval '10 minutes', now() - interval '9 minutes'),
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 61, 61, 'CI',
   'pull_request', 'fix/x', 'def', 'completed', 'success',
   'https://github.com/alice/repo-a/actions/runs/61', now() - interval '5 minutes', now() - interval '4 minutes');

-- 1. a mesma execução não entra duas vezes no mesmo repositório
select throws_ok(
  $$ insert into public.ci_runs
       (repository_id, organization_id, github_run_id, run_number, workflow_name, event,
        head_sha, status, html_url, started_at)
     values ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
             60, 60, 'CI', 'push', 'abc', 'completed', 'https://x', now()) $$,
  '23505', null,
  'execução repetida é recusada'
);

-- ---------- carol (stakeholder da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

-- 2. positivo: membro lê o histórico da própria organização
select results_eq(
  $$ select run_number, conclusion from public.ci_runs order by run_number $$,
  $$ values (60, 'failure'::text), (61, 'success'::text) $$,
  'membro lê as execuções do CI'
);

-- 3-5. negativo: o front não grava, altera nem apaga execuções
select throws_ok(
  $$ insert into public.ci_runs
       (repository_id, organization_id, github_run_id, run_number, workflow_name, event,
        head_sha, status, html_url, started_at)
     values ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
             99, 99, 'CI', 'push', 'zzz', 'completed', 'https://x', now()) $$,
  '42501', null,
  'o front não grava execuções'
);

select throws_ok(
  $$ update public.ci_runs set conclusion = 'success' $$,
  '42501', null,
  'o front não altera execuções'
);

select throws_ok(
  $$ delete from public.ci_runs $$,
  '42501', null,
  'o front não apaga execuções'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

-- 6. negativo: outra organização não vê o histórico
select is_empty(
  $$ select 1 from public.ci_runs $$,
  'outra organização não vê as execuções do CI'
);

select * from finish();
rollback;
