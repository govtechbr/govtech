-- =====================================================================
-- Testes pgTAP da migration audit_events (E7, regras AU1–AU7).
-- Roda numa transação que termina em ROLLBACK. Sem Docker, converter com
-- scripts/to_sql_editor.py e rodar no SQL Editor (ver backend/README.md).
--
-- Cenário:
--   Org A: alice (admin), bob (developer), carol (stakeholder)
--   Org B: dave (admin)
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(19);

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

-- 1. sem login (montagem dos dados), quem agiu é o Sistema
select results_eq(
  $$ select actor_name, actor_id from public.audit_events
     where organization_id = '10000000-0000-0000-0000-00000000000a'
       and action = 'member.joined' and entity_name = 'Bob' $$,
  $$ values ('Sistema'::text, null::uuid) $$,
  'entrada de membro sem login fica como Sistema'
);

-- ---------- alice (admin da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

-- sem id: o authenticated não escreve a coluna id (grant por coluna)
insert into public.projects (organization_id, name, deadline, priority)
values ('10000000-0000-0000-0000-00000000000a', 'Portal', '2026-12-01', 'high');
update public.projects set progress = 40, priority = 'low'
where organization_id = '10000000-0000-0000-0000-00000000000a' and name = 'Portal';
-- só a coluna antiga de status: não é mudança para a auditoria
update public.projects set status = 'danger'
where organization_id = '10000000-0000-0000-0000-00000000000a' and name = 'Portal';
delete from public.projects where organization_id = '10000000-0000-0000-0000-00000000000a' and name = 'Portal';

update public.organization_members set role = 'stakeholder'
where organization_id = '10000000-0000-0000-0000-00000000000a'
  and user_id = '00000000-0000-0000-0000-00000000000b';
delete from public.organization_members
where organization_id = '10000000-0000-0000-0000-00000000000a'
  and user_id = '00000000-0000-0000-0000-00000000000b';
select public.regenerate_join_code('10000000-0000-0000-0000-00000000000a');

-- 2-8. o que alice fez ficou registrado, com quem agiu (AU1, AU2)
select results_eq(
  $$ select action, actor_name, actor_role, entity_name from public.audit_events
     where entity_type = 'project' order by id $$,
  $$ values ('project.created', 'Alice', 'admin', 'Portal'),
            ('project.updated', 'Alice', 'admin', 'Portal'),
            ('project.deleted', 'Alice', 'admin', 'Portal') $$,
  'criar, alterar e excluir projeto gera um evento cada, com quem agiu'
);

select results_eq(
  $$ select details from public.audit_events where action = 'project.updated' $$,
  $$ values ('{"priority": {"from": "high", "to": "low"}, "progress": {"from": 0, "to": 40}}'::jsonb) $$,
  'alteração guarda só os campos que mudaram, com antes e depois'
);

select results_eq(
  $$ select details -> 'deadline' ->> 'to', details -> 'name' ->> 'to' from public.audit_events
     where action = 'project.created' $$,
  $$ values ('2026-12-01'::text, 'Portal'::text) $$,
  'criação guarda os campos do projeto'
);

select results_eq(
  $$ select details from public.audit_events where action = 'member.role_changed' $$,
  $$ values ('{"from": "developer", "to": "stakeholder"}'::jsonb) $$,
  'troca de papel guarda o papel antigo e o novo'
);

select results_eq(
  $$ select action, entity_name from public.audit_events
     where action in ('member.removed', 'member.left') $$,
  $$ values ('member.removed'::text, 'Bob'::text) $$,
  'remoção de membro por outra pessoa é registrada'
);

select results_eq(
  $$ select count(*)::int from public.audit_events
     where action = 'organization.join_code_regenerated' $$,
  $$ values (1) $$,
  'gerar código novo é registrado'
);

select is_empty(
  $$ select 1 from public.audit_events a
     join public.organizations o on o.id = a.organization_id
     where a.details::text like '%CODEA00001%'
        or a.details::text like '%' || o.join_code || '%' $$,
  'o código de convite nunca vai para a auditoria'
);

-- 9-11. ninguém escreve direto, nem altera, nem apaga (AU3)
select throws_ok(
  $$ insert into public.audit_events (organization_id, actor_name, action, entity_type)
     values ('10000000-0000-0000-0000-00000000000a', 'Alice', 'project.created', 'project') $$,
  '42501', null,
  'o front não grava eventos'
);

select throws_ok(
  $$ update public.audit_events set actor_name = 'Outra pessoa' $$,
  '42501', null,
  'o front não altera eventos'
);

select throws_ok(
  $$ delete from public.audit_events $$,
  '42501', null,
  'o front não apaga eventos'
);

-- ---------- carol (stakeholder da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

-- 12. stakeholder vê (AU4)
select isnt_empty(
  $$ select 1 from public.audit_events where action = 'project.created' $$,
  'stakeholder vê a auditoria'
);

-- ---------- bob (agora fora da Org A) e um developer de verdade ----------
reset role;
insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', 'developer');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

-- 13. developer não vê (AU4)
select is_empty(
  $$ select 1 from public.audit_events $$,
  'developer não vê a auditoria'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

-- 14. outra empresa não vê
select is_empty(
  $$ select 1 from public.audit_events
     where organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'outra organização não vê a auditoria'
);

-- 15. só a Edge Function registra ações do GitHub
select throws_ok(
  $$ select public.audit_record('10000000-0000-0000-0000-00000000000b', null,
       'github.synced', 'project', null, 'Falso', '{}') $$,
  '42501', null,
  'ninguém logado registra evento pela função da Edge Function'
);

-- ---------- visitante sem login ----------
set local role anon;

-- 16. anon
select throws_ok(
  $$ select 1 from public.audit_events $$,
  '42501', null,
  'visitante sem login não lê a auditoria'
);

-- ---------- servidor (chave de serviço) ----------
set local role service_role;

select public.audit_record('10000000-0000-0000-0000-00000000000a', null, 'github.synced',
  'project', null, 'Portal', '{"pullRequests": 12, "partial": false}');

-- 17. a Edge Function registra a sincronização do agendador
select results_eq(
  $$ select actor_name, details ->> 'pullRequests' from public.audit_events
     where organization_id = '10000000-0000-0000-0000-00000000000a'
       and action = 'github.synced' $$,
  $$ values ('Sistema'::text, '12'::text) $$,
  'sincronização do agendador é registrada como Sistema'
);

-- 18. nem a chave de serviço altera (AU3)
select throws_ok(
  $$ delete from public.audit_events $$,
  '42501', null,
  'nem a chave de serviço apaga eventos'
);

-- ---------- excluir a empresa (como postgres) ----------
reset role;
delete from public.organizations where id = '10000000-0000-0000-0000-00000000000a';

-- 19. os eventos vão junto
select is_empty(
  $$ select 1 from public.audit_events
     where organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'excluir a empresa leva a auditoria junto'
);

select * from finish();
rollback;
