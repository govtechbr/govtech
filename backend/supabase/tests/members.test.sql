-- =====================================================================
-- Testes pgTAP da migration members: e-mail no perfil e último admin.
-- Roda numa transação que termina em ROLLBACK. Sem Docker, converter com
-- scripts/to_sql_editor.py e rodar no SQL Editor (ver backend/README.md).
--
-- Cenário:
--   Org A: alice (admin), bob (developer), carol (viewer)
--   Org B: dave (admin)
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

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
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'viewer'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

-- 1. cadastro guarda o e-mail no perfil
select results_eq(
  $$ select email from public.profiles where id = '00000000-0000-0000-0000-00000000000d' $$,
  $$ values ('dave@test.local') $$,
  'cadastro guarda o e-mail no perfil'
);

-- ---------- carol (viewer da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select results_eq(
  $$ select email from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('alice@test.local') $$,
  'colega da mesma organização vê o e-mail'
);

select throws_ok(
  $$ update public.profiles set email = 'outro@test.local'
     where id = '00000000-0000-0000-0000-00000000000c' $$,
  '42501', null,
  'usuário não altera o próprio e-mail pelo app'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select email from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  'quem é de outra organização não vê o e-mail'
);

-- ---------- alice (única admin da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ update public.organization_members set role = 'viewer'
     where user_id = '00000000-0000-0000-0000-00000000000a'
       and organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'P0001', 'A organização precisa de pelo menos um administrador.',
  'último admin não se rebaixa'
);

select throws_ok(
  $$ delete from public.organization_members
     where user_id = '00000000-0000-0000-0000-00000000000a'
       and organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'P0001', 'A organização precisa de pelo menos um administrador.',
  'último admin não sai da organização'
);

update public.organization_members set role = 'admin'
  where user_id = '00000000-0000-0000-0000-00000000000b';
select lives_ok(
  $$ delete from public.organization_members
     where user_id = '00000000-0000-0000-0000-00000000000a'
       and organization_id = '10000000-0000-0000-0000-00000000000a' $$,
  'com outro admin, o admin pode sair'
);

-- ---------- exclusão em cascata (como postgres) ----------
reset role;
delete from public.organizations where id = '10000000-0000-0000-0000-00000000000b';
select is_empty(
  $$ select 1 from public.organization_members
     where organization_id = '10000000-0000-0000-0000-00000000000b' $$,
  'apagar a organização leva os membros, mesmo o último admin'
);

select * from finish();
rollback;
