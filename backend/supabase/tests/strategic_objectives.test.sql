-- E10: direcionadores estratégicos (migration strategic_objectives)
-- Cenário:
--   Org A: alice (admin), bob (developer), carol (stakeholder)
--   Org B: dave (admin)
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(17);

-- ---------- dados de teste (como postgres) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local',   '{"full_name":"Bob"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test.local', '{"full_name":"Carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@test.local',  '{"full_name":"Dave"}');

insert into public.organizations (id, name, join_code) values
  ('10000000-0000-0000-0000-00000000000a', 'Org A', 'CODEA00001'),
  ('10000000-0000-0000-0000-00000000000b', 'Org B', 'CODEB00001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', 'developer'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'stakeholder'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.strategic_objectives (id, organization_id, title) values
  ('40000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Crescer'),
  ('40000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Meta B');

insert into public.projects (id, organization_id, name) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Projeto A');

-- ---------- carol (stakeholder da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select title from public.strategic_objectives $$,
  $$ values ('Crescer') $$,
  'stakeholder vê só os objetivos da própria empresa'
);

select throws_ok(
  $$ insert into public.strategic_objectives (organization_id, title)
     values ('10000000-0000-0000-0000-00000000000a', 'Invasor') $$,
  '42501', null,
  'stakeholder não cria objetivo'
);

-- ---------- bob (developer da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select throws_ok(
  $$ insert into public.strategic_objectives (organization_id, title)
     values ('10000000-0000-0000-0000-00000000000a', 'Invasor') $$,
  '42501', null,
  'developer não cria objetivo'
);

select is_empty(
  $$ with changed as (
       update public.strategic_objectives set title = 'Trocado'
       where id = '40000000-0000-0000-0000-00000000000a' returning 1
     ) select * from changed $$,
  'developer não edita objetivo (nenhuma linha muda)'
);

select lives_ok(
  $$ update public.projects set objective_id = '40000000-0000-0000-0000-00000000000a'
     where id = '20000000-0000-0000-0000-00000000000a' $$,
  'developer vincula o projeto a um objetivo da empresa'
);

select throws_ok(
  $$ update public.projects set objective_id = '40000000-0000-0000-0000-00000000000b'
     where id = '20000000-0000-0000-0000-00000000000a' $$,
  '23503', null,
  'projeto não aponta para objetivo de outra empresa'
);

select is_empty(
  $$ with changed as (
       update public.organizations set mission = 'Invasora'
       where id = '10000000-0000-0000-0000-00000000000a' returning 1
     ) select * from changed $$,
  'developer não altera a missão (nenhuma linha muda)'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select results_eq(
  $$ select title from public.strategic_objectives $$,
  $$ values ('Meta B') $$,
  'outra empresa não vê os objetivos da Org A'
);

-- ---------- alice (admin da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select lives_ok(
  $$ insert into public.strategic_objectives (organization_id, title)
     values ('10000000-0000-0000-0000-00000000000a', 'Reduzir riscos') $$,
  'admin cria objetivo'
);

select lives_ok(
  $$ update public.strategic_objectives set description = 'Menos PRs parados'
     where title = 'Reduzir riscos' $$,
  'admin edita objetivo'
);

select lives_ok(
  $$ update public.organizations set mission = 'Missão X', vision = 'Visão Y'
     where id = '10000000-0000-0000-0000-00000000000a' $$,
  'admin altera missão e visão'
);

select results_eq(
  $$ select actor_name from public.audit_events
     where action = 'objective.created' and entity_name = 'Reduzir riscos' $$,
  $$ values ('Alice') $$,
  'a auditoria registra quem criou o objetivo'
);

select results_eq(
  $$ select details #>> '{objective,to}' from public.audit_events
     where action = 'project.updated' $$,
  $$ values ('Crescer') $$,
  'a auditoria registra o vínculo do projeto com o título do objetivo'
);

select results_eq(
  $$ select details #>> '{mission,to}' from public.audit_events
     where action = 'organization.strategy_updated' $$,
  $$ values ('Missão X') $$,
  'a auditoria registra a mudança de missão'
);

select lives_ok(
  $$ delete from public.strategic_objectives where id = '40000000-0000-0000-0000-00000000000a' $$,
  'admin exclui objetivo'
);

select results_eq(
  $$ select objective_id is null from public.projects
     where id = '20000000-0000-0000-0000-00000000000a' $$,
  $$ values (true) $$,
  'excluir o objetivo desfaz o vínculo e o projeto continua'
);

select is_empty(
  $$ with removed as (
       delete from public.strategic_objectives
       where id = '40000000-0000-0000-0000-00000000000b' returning 1
     ) select * from removed $$,
  'admin da Org A não exclui objetivo da Org B'
);

select * from finish();
rollback;
