-- =====================================================================
-- Testes pgTAP da migration repository_selection (E1): fim do papel viewer,
-- repositório uma vez por empresa, ligação N:N com projetos e limpeza.
-- Roda numa transação que termina em ROLLBACK. Sem Docker, converter com
-- scripts/to_sql_editor.py e rodar no SQL Editor (ver backend/README.md).
--
-- Cenário:
--   Org A: alice (admin), carol (stakeholder); projetos P1 e P2
--          R1 está em P1 e P2 (compartilhado), R2 só em P1
--   Org B: dave (admin); projeto P3 com R3
--   eve: sem empresa
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(11);

-- ---------- dados de teste (como postgres) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test.local', '{"full_name":"Carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@test.local',  '{"full_name":"Dave"}'),
  ('00000000-0000-0000-0000-00000000000e', 'eve@test.local',   '{"full_name":"Eve"}');

insert into public.organizations (id, name, join_code) values
  ('10000000-0000-0000-0000-00000000000a', 'Org A', 'CODEA00001'),
  ('10000000-0000-0000-0000-00000000000b', 'Org B', 'CODEB00001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'stakeholder'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.projects (id, organization_id, name) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 'P1'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', 'P2'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000b', 'P3');

insert into public.repositories (id, organization_id, github_id, full_name, name, html_url) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 1, 'a/r1', 'r1', 'https://github.com/a/r1'),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a', 2, 'a/r2', 'r2', 'https://github.com/a/r2'),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000b', 3, 'b/r3', 'r3', 'https://github.com/b/r3');

insert into public.project_repositories (project_id, repository_id, organization_id) values
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-00000000000a'),
  ('20000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-00000000000b');

insert into public.pull_requests
  (repository_id, organization_id, number, title, state, html_url, created_at_github, updated_at_github) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-00000000000a', 1, 'PR R1', 'open',
   'https://github.com/a/r1/pull/1', now(), now());

-- 1. o papel viewer não existe mais
select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role)
     values ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000e', 'viewer') $$,
  '23514', null,
  'ninguém recebe o papel viewer'
);

-- 2. o mesmo repositório não entra duas vezes na mesma empresa
select throws_ok(
  $$ insert into public.repositories (organization_id, github_id, full_name, name, html_url)
     values ('10000000-0000-0000-0000-00000000000a', 1, 'a/r1', 'r1', 'https://github.com/a/r1') $$,
  '23505', null,
  'repositório é guardado uma vez por empresa'
);

-- ---------- eve (sem empresa) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';

select public.join_organization('CODEA00001');
select results_eq(
  $$ select role::text from public.organization_members
     where user_id = '00000000-0000-0000-0000-00000000000e' $$,
  $$ values ('stakeholder') $$,
  'quem entra pelo código começa como stakeholder'
);

-- ---------- carol (stakeholder da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select count(*)::int from public.repositories $$,
  $$ values (2) $$,
  'na visão da empresa, o repositório compartilhado conta uma vez'
);

select results_eq(
  $$ select p.name, count(pr.repository_id)::int
     from public.projects p
     join public.project_repositories pr on pr.project_id = p.id
     group by p.name order by p.name $$,
  $$ values ('P1', 2), ('P2', 1) $$,
  'cada projeto vê todos os seus repositórios, inclusive o compartilhado'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.project_repositories
     where organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'outra empresa não vê as ligações'
);

-- ---------- alice (admin da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ insert into public.project_repositories (project_id, repository_id, organization_id)
     values ('20000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002',
             '10000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'o front não liga repositórios (só a Edge Function)'
);

-- ---------- servidor (como postgres): limpeza ----------
reset role;

delete from public.project_repositories
where project_id = '20000000-0000-0000-0000-000000000002'
  and repository_id = '30000000-0000-0000-0000-000000000001';
select isnt_empty(
  $$ select 1 from public.repositories where id = '30000000-0000-0000-0000-000000000001' $$,
  'tirar o repositório de um projeto não apaga se outro projeto usa'
);

delete from public.project_repositories
where project_id = '20000000-0000-0000-0000-000000000001'
  and repository_id = '30000000-0000-0000-0000-000000000001';
select results_eq(
  $$ select (select count(*) from public.repositories where id = '30000000-0000-0000-0000-000000000001')::int,
            (select count(*) from public.pull_requests where repository_id = '30000000-0000-0000-0000-000000000001')::int $$,
  $$ values (0, 0) $$,
  'sem nenhum projeto, o repositório sai com os PRs'
);

delete from public.projects where id = '20000000-0000-0000-0000-000000000001';
select is_empty(
  $$ select 1 from public.repositories where id = '30000000-0000-0000-0000-000000000002' $$,
  'excluir o projeto apaga os repositórios que só ele usava'
);

select private.github_save_token(
  '20000000-0000-0000-0000-000000000003', 'github_pat_dave_12345678', 'dave-gh',
  '00000000-0000-0000-0000-00000000000d'
);
select private.github_disconnect('20000000-0000-0000-0000-000000000003');
select results_eq(
  $$ select (select count(*) from public.repositories where id = '30000000-0000-0000-0000-000000000003')::int,
            (select count(*) from public.github_credentials where project_id = '20000000-0000-0000-0000-000000000003')::int $$,
  $$ values (0, 0) $$,
  'desconectar a chave desfaz as ligações e apaga os repositórios sem projeto'
);

select * from finish();
rollback;
