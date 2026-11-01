-- =====================================================================
-- Testes pgTAP da migration github: chave no Vault e dados sincronizados.
-- Roda numa transação que termina em ROLLBACK. Sem Docker, converter com
-- scripts/to_sql_editor.py e rodar no SQL Editor (ver backend/README.md).
--
-- Cenário:
--   Org A: alice (admin), carol (viewer), projeto A conectado ao GitHub
--   Org B: dave (admin), projeto B com dados sincronizados
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(15);

-- ---------- dados de teste (como postgres) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test.local', '{"full_name":"Carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@test.local',  '{"full_name":"Dave"}');

insert into public.organizations (id, name, join_code) values
  ('10000000-0000-0000-0000-00000000000a', 'Org A', 'CODEA00001'),
  ('10000000-0000-0000-0000-00000000000b', 'Org B', 'CODEB00001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'viewer'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.projects (id, organization_id, name) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Projeto A'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Projeto B');

select private.github_save_token(
  '20000000-0000-0000-0000-00000000000a', 'github_pat_teste_abcd', 'alice-gh',
  '00000000-0000-0000-0000-00000000000a'
);

insert into public.repositories (id, project_id, organization_id, github_id, full_name, name, html_url) values
  ('30000000-0000-0000-0000-00000000000a', '20000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-00000000000a', 1, 'alice/repo-a', 'repo-a', 'https://github.com/alice/repo-a'),
  ('30000000-0000-0000-0000-00000000000b', '20000000-0000-0000-0000-00000000000b',
   '10000000-0000-0000-0000-00000000000b', 2, 'dave/repo-b', 'repo-b', 'https://github.com/dave/repo-b');

insert into public.pull_requests
  (repository_id, organization_id, number, title, state, html_url, created_at_github, updated_at_github) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 1, 'PR A', 'open',
   'https://github.com/alice/repo-a/pull/1', now(), now());

insert into public.branches (repository_id, organization_id, name, last_commit_sha) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'main', 'abc1234');

-- 1-2. a chave vai para o Vault; a tabela guarda só os 4 últimos caracteres
select results_eq(
  $$ select token_last4, github_login from public.github_credentials
     where project_id = '20000000-0000-0000-0000-00000000000a' $$,
  $$ values ('abcd', 'alice-gh') $$,
  'conexão guarda só os 4 últimos caracteres e o login'
);

select results_eq(
  $$ select public.github_read_token('20000000-0000-0000-0000-00000000000a') $$,
  $$ values ('github_pat_teste_abcd') $$,
  'a chave fica no Vault e só o servidor a lê de volta'
);

-- ---------- carol (viewer da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select full_name from public.repositories $$,
  $$ values ('alice/repo-a') $$,
  'membro vê só os repositórios da própria organização'
);

select results_eq(
  $$ select (select count(*) from public.pull_requests)::int, (select count(*) from public.branches)::int $$,
  $$ values (1, 1) $$,
  'membro vê os PRs e branches da própria organização'
);

select results_eq(
  $$ select token_last4 from public.github_credentials $$,
  $$ values ('abcd') $$,
  'membro vê que o projeto está conectado (só o final da chave)'
);

select throws_ok(
  $$ select secret_id from public.github_credentials $$,
  '42501', null,
  'ninguém logado lê a referência do segredo'
);

-- ---------- alice (admin da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ select public.github_read_token('20000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'nem o admin lê a chave pela API'
);

select throws_ok(
  $$ select decrypted_secret from vault.decrypted_secrets $$,
  '42501', null,
  'ninguém logado acessa o Vault'
);

select throws_ok(
  $$ insert into public.repositories (project_id, organization_id, github_id, full_name, name, html_url)
     values ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
             9, 'x/y', 'y', 'https://github.com/x/y') $$,
  '42501', null,
  'o front não grava repositórios (só a Edge Function)'
);

select throws_ok(
  $$ update public.pull_requests set title = 'alterado' $$,
  '42501', null,
  'o front não altera PRs'
);

select throws_ok(
  $$ delete from public.branches $$,
  '42501', null,
  'o front não apaga branches'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.github_credentials where project_id = '20000000-0000-0000-0000-00000000000a' $$,
  'outra organização não vê a conexão'
);

-- ---------- servidor (como postgres) ----------
reset role;

select private.github_save_token(
  '20000000-0000-0000-0000-00000000000a', 'github_pat_nova_wxyz', 'alice-gh',
  '00000000-0000-0000-0000-00000000000a'
);
select results_eq(
  $$ select (select count(*) from vault.secrets where name = 'github:20000000-0000-0000-0000-00000000000a')::int,
            (select token_last4 from public.github_credentials where project_id = '20000000-0000-0000-0000-00000000000a') $$,
  $$ values (1, 'wxyz') $$,
  'trocar a chave atualiza o mesmo segredo'
);

select private.github_disconnect('20000000-0000-0000-0000-00000000000a');
select results_eq(
  $$ select (select count(*) from public.github_credentials where project_id = '20000000-0000-0000-0000-00000000000a')::int,
            (select count(*) from public.repositories where project_id = '20000000-0000-0000-0000-00000000000a')::int,
            (select count(*) from vault.secrets where name = 'github:20000000-0000-0000-0000-00000000000a')::int $$,
  $$ values (0, 0, 0) $$,
  'desconectar apaga a conexão, os dados e o segredo'
);

select private.github_save_token(
  '20000000-0000-0000-0000-00000000000b', 'github_pat_dave_1234', 'dave-gh',
  '00000000-0000-0000-0000-00000000000d'
);
delete from public.projects where id = '20000000-0000-0000-0000-00000000000b';
select is_empty(
  $$ select 1 from vault.secrets where name = 'github:20000000-0000-0000-0000-00000000000b' $$,
  'excluir o projeto também apaga o segredo do Vault'
);

select * from finish();
rollback;
