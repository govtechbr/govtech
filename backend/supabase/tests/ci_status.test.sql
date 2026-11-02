-- =====================================================================
-- Testes pgTAP da migration ci_status (regra G10): estado do CI em PRs e
-- repositórios. Roda numa transação que termina em ROLLBACK. Sem Docker,
-- converter com scripts/to_sql_editor.py e rodar no SQL Editor (backend/README.md).
--
-- Cenário:
--   Org A: carol (stakeholder), repositório com CI falhando e PR verde
--   Org B: dave (admin), sem acesso aos dados da Org A
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(7);

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

insert into public.repositories (id, organization_id, github_id, full_name, name, html_url, ci_state) values
  ('30000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-00000000000a', 1, 'alice/repo-a', 'repo-a', 'https://github.com/alice/repo-a', 'failure');

insert into public.pull_requests
  (repository_id, organization_id, number, title, state, html_url, created_at_github, updated_at_github, ci_state) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 1, 'PR verde', 'open',
   'https://github.com/alice/repo-a/pull/1', now(), now(), 'success'),
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 2, 'PR sem CI', 'open',
   'https://github.com/alice/repo-a/pull/2', now(), now(), null);

-- 1-2. só os três estados da regra G10 (ou null = sem CI)
select throws_ok(
  $$ update public.pull_requests set ci_state = 'SUCCESS' where number = 1 $$,
  '23514', null,
  'PR só aceita success, failure, pending ou null'
);

select throws_ok(
  $$ update public.repositories set ci_state = 'broken' $$,
  '23514', null,
  'repositório só aceita success, failure, pending ou null'
);

-- ---------- carol (stakeholder da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

-- 3-4. positivo: membro lê o CI da própria organização
select results_eq(
  $$ select ci_state from public.repositories $$,
  $$ values ('failure'::text) $$,
  'membro lê o CI da branch principal'
);

select results_eq(
  $$ select number, ci_state from public.pull_requests order by number $$,
  $$ values (1, 'success'::text), (2, null::text) $$,
  'membro lê o CI de cada PR (null = sem CI)'
);

-- 5-6. negativo: o front não grava o CI
select throws_ok(
  $$ update public.pull_requests set ci_state = 'failure' $$,
  '42501', null,
  'o front não altera o CI de PRs'
);

select throws_ok(
  $$ update public.repositories set ci_state = 'success' $$,
  '42501', null,
  'o front não altera o CI da branch principal'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

-- 7. negativo: outra organização não vê o CI
select is_empty(
  $$ select ci_state from public.pull_requests $$,
  'outra organização não vê o CI'
);

select * from finish();
rollback;
