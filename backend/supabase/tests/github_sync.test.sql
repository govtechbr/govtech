-- E3: commits, aprovações, último erro e agendamento (migration github_sync_hourly)
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(9);

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
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'stakeholder'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.projects (id, organization_id, name) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Projeto A');

insert into public.repositories (id, organization_id, github_id, full_name, name, html_url) values
  ('30000000-0000-0000-0000-00000000000a',
   '10000000-0000-0000-0000-00000000000a', 1, 'alice/repo-a', 'repo-a', 'https://github.com/alice/repo-a');

insert into public.project_repositories (project_id, repository_id, organization_id) values
  ('20000000-0000-0000-0000-00000000000a', '30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a');

insert into public.pull_requests
  (repository_id, organization_id, number, title, state, html_url, created_at_github, updated_at_github,
   approval_count, author_avatar_url) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 1, 'PR A', 'merged',
   'https://github.com/alice/repo-a/pull/1', now(), now(), 2, 'https://avatars.githubusercontent.com/u/1');

insert into public.commits (repository_id, organization_id, sha, author_login, committed_at) values
  ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'abc123', 'alice-gh', now());

select private.github_save_token(
  '20000000-0000-0000-0000-00000000000a', 'github_pat_teste_abcd', 'alice-gh',
  '00000000-0000-0000-0000-00000000000a'
);
update public.github_credentials set last_sync_error = 'Chave do GitHub inválida ou expirada.'
where project_id = '20000000-0000-0000-0000-00000000000a';

-- 1-2. o agendador existe e a senha dele está no Vault
select results_eq(
  $$ select schedule, active from cron.job where jobname = 'github-sync-hourly' $$,
  $$ values ('7 * * * *'::text, true) $$,
  'a sincronização roda sozinha a cada hora'
);

select results_eq(
  $$ select char_length(public.github_cron_secret()) $$,
  $$ values (64) $$,
  'a senha do agendador é gerada no Vault'
);

-- ---------- carol (stakeholder da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select sha, author_login from public.commits $$,
  $$ values ('abc123', 'alice-gh') $$,
  'membro vê os commits da própria organização'
);

select results_eq(
  $$ select approval_count from public.pull_requests $$,
  $$ values (2) $$,
  'membro vê quantas aprovações o PR teve'
);

select results_eq(
  $$ select last_sync_error from public.github_credentials $$,
  $$ values ('Chave do GitHub inválida ou expirada.') $$,
  'membro vê por que a sincronização automática falhou'
);

select throws_ok(
  $$ insert into public.commits (repository_id, organization_id, sha, committed_at)
     values ('30000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'zzz', now()) $$,
  '42501', null,
  'o front não grava commits (só a Edge Function)'
);

select throws_ok(
  $$ select public.github_cron_secret() $$,
  '42501', null,
  'ninguém logado lê a senha do agendador'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.commits $$,
  'outra organização não vê os commits'
);

-- ---------- servidor (como postgres) ----------
reset role;

delete from public.project_repositories
where project_id = '20000000-0000-0000-0000-00000000000a';
select is_empty(
  $$ select 1 from public.commits where sha = 'abc123' $$,
  'repositório sem projeto sai com os commits'
);

select * from finish();
rollback;
