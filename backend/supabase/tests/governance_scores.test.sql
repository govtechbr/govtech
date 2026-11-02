-- E5: Índice de Governança (migration governance_scores)
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(6);

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

insert into public.governance_scores (project_id, organization_id, day, score, components) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', '2026-11-02', 74,
   '{"review": 50, "flow": 100, "deadline": 100, "protection": 0, "leadTime": 80}');

-- ---------- carol (stakeholder da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select score, (components ->> 'review')::int from public.governance_scores $$,
  $$ values (74::smallint, 50) $$,
  'membro vê o índice da própria organização'
);

select throws_ok(
  $$ insert into public.governance_scores (project_id, organization_id, day, score, components)
     values ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a',
             '2026-11-03', 100, '{}') $$,
  '42501', null,
  'o front não grava o índice (só a Edge Function)'
);

select throws_ok(
  $$ update public.governance_scores set score = 100 $$,
  '42501', null,
  'o front não altera o índice'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.governance_scores $$,
  'outra organização não vê o índice'
);

-- ---------- visitante sem login ----------
set local role anon;

select throws_ok(
  $$ select 1 from public.governance_scores $$,
  '42501', null,
  'visitante sem login não lê o índice'
);

-- ---------- servidor (como postgres) ----------
reset role;

delete from public.projects where id = '20000000-0000-0000-0000-00000000000a';
select is_empty(
  $$ select 1 from public.governance_scores $$,
  'projeto excluído leva o histórico do índice junto'
);

select * from finish();
rollback;
