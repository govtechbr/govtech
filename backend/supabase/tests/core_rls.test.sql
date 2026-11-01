-- =====================================================================
-- Testes pgTAP das regras de acesso (RLS) do core_schema.
-- Cada regra tem caso positivo e negativo (AGENTS.md).
--
-- Roda dentro de uma transação que termina em ROLLBACK: nada do que o
-- teste cria fica no banco. Sem Docker, roda no SQL Editor do govtech-br
-- depois de convertido por scripts/to_sql_editor.py (ver backend/README.md);
-- com Docker, `supabase test db` também funciona.
--
-- Cenário:
--   Org A: alice (admin), bob (developer), carol (stakeholder)
--   Org B: dave (admin)
--   eve: sem organização
-- =====================================================================

begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(25);

-- ---------- dados de teste (como postgres) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local',   '{"full_name":"Bob"}'),
  ('00000000-0000-0000-0000-00000000000c', 'carol@test.local', '{"full_name":"Carol"}'),
  ('00000000-0000-0000-0000-00000000000d', 'dave@test.local',  '{"full_name":"Dave"}'),
  ('00000000-0000-0000-0000-00000000000e', 'eve@test.local',   '{"full_name":"Eve"}');

insert into public.organizations (id, name, join_code) values
  ('10000000-0000-0000-0000-00000000000a', 'Org A', 'CODEA00001'),
  ('10000000-0000-0000-0000-00000000000b', 'Org B', 'CODEB00001');

insert into public.organization_members (organization_id, user_id, role) values
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000a', 'admin'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000b', 'developer'),
  ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-00000000000c', 'stakeholder'),
  ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000d', 'admin');

insert into public.projects (id, organization_id, name) values
  ('20000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-00000000000a', 'Projeto A'),
  ('20000000-0000-0000-0000-00000000000b', '10000000-0000-0000-0000-00000000000b', 'Projeto B');

-- 1. trigger cria o perfil no cadastro
select results_eq(
  $$ select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Alice') $$,
  'cadastro cria o perfil com o nome informado'
);

-- ---------- alice (admin da Org A) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select results_eq(
  $$ select name from public.projects order by name $$,
  $$ values ('Projeto A') $$,
  'membro vê só os projetos da própria organização'
);

select is_empty(
  $$ select 1 from public.organizations where id = '10000000-0000-0000-0000-00000000000b' $$,
  'não-membro não vê a organização (nem o código dela)'
);

select lives_ok(
  $$ insert into public.projects (organization_id, name) values ('10000000-0000-0000-0000-00000000000a', 'Novo A') $$,
  'admin cria projeto na própria organização'
);

select throws_ok(
  $$ insert into public.projects (organization_id, name) values ('10000000-0000-0000-0000-00000000000b', 'Invasão') $$,
  '42501', null,
  'ninguém cria projeto em organização alheia'
);

select throws_ok(
  $$ update public.projects set organization_id = '10000000-0000-0000-0000-00000000000b'
     where id = '20000000-0000-0000-0000-00000000000a' $$,
  '42501', null,
  'projeto não muda de organização'
);

select isnt(
  public.regenerate_join_code('10000000-0000-0000-0000-00000000000a'),
  'CODEA00001',
  'admin gera um novo código de entrada'
);

select lives_ok(
  $$ update public.organization_members set role = 'stakeholder'
     where user_id = '00000000-0000-0000-0000-00000000000b' $$,
  'admin muda o papel de um membro'
);
update public.organization_members set role = 'developer'
  where user_id = '00000000-0000-0000-0000-00000000000b';

-- ---------- bob (developer da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select lives_ok(
  $$ insert into public.projects (organization_id, name) values ('10000000-0000-0000-0000-00000000000a', 'Do Bob') $$,
  'developer cria projeto'
);

update public.projects set progress = 50 where id = '20000000-0000-0000-0000-00000000000a';
select results_eq(
  $$ select progress from public.projects where id = '20000000-0000-0000-0000-00000000000a' $$,
  $$ values (50::smallint) $$,
  'developer edita projeto'
);

delete from public.projects where id = '20000000-0000-0000-0000-00000000000a';
select isnt_empty(
  $$ select 1 from public.projects where id = '20000000-0000-0000-0000-00000000000a' $$,
  'developer não exclui projeto'
);

select throws_ok(
  $$ select public.regenerate_join_code('10000000-0000-0000-0000-00000000000a') $$,
  '42501', null,
  'só admin gera novo código'
);

-- ---------- carol (stakeholder da Org A) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';

select throws_ok(
  $$ insert into public.projects (organization_id, name) values ('10000000-0000-0000-0000-00000000000a', 'Da Carol') $$,
  '42501', null,
  'stakeholder não cria projeto'
);

update public.projects set progress = 99 where id = '20000000-0000-0000-0000-00000000000a';
select results_eq(
  $$ select progress from public.projects where id = '20000000-0000-0000-0000-00000000000a' $$,
  $$ values (50::smallint) $$,
  'stakeholder não edita projeto'
);

update public.organization_members set role = 'admin'
  where user_id = '00000000-0000-0000-0000-00000000000c';
select results_eq(
  $$ select role::text from public.organization_members where user_id = '00000000-0000-0000-0000-00000000000c' $$,
  $$ values ('stakeholder') $$,
  'stakeholder não se promove a admin'
);

update public.profiles set full_name = 'Hackeada' where id = '00000000-0000-0000-0000-00000000000a';
select results_eq(
  $$ select full_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values ('Alice') $$,
  'usuário não edita o perfil de outro'
);

select isnt_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  'colega da mesma organização vê o perfil'
);

select throws_ok(
  $$ insert into public.organization_members (organization_id, user_id, role)
     values ('10000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-00000000000c', 'admin') $$,
  '42501', null,
  'ninguém se insere direto numa organização'
);

-- ---------- dave (admin da Org B) ----------
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000d","role":"authenticated"}';

select is_empty(
  $$ select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000a' $$,
  'quem é de outra organização não vê o perfil'
);

delete from public.projects where id = '20000000-0000-0000-0000-00000000000a';
reset role;
select isnt_empty(
  $$ select 1 from public.projects where id = '20000000-0000-0000-0000-00000000000a' $$,
  'admin de outra organização não exclui projeto alheio'
);

-- ---------- eve (sem organização) ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000e","role":"authenticated"}';

select throws_ok(
  $$ select public.join_organization('NAOEXISTE') $$,
  'P0002', 'Código de organização inválido.',
  'código errado não entra e não revela nada'
);

select is(
  public.join_organization('codeb00001'),
  '10000000-0000-0000-0000-00000000000b'::uuid,
  'código certo entra na organização (sem diferenciar maiúsculas)'
);

select results_eq(
  $$ select role::text from public.organization_members
     where user_id = '00000000-0000-0000-0000-00000000000e'
       and organization_id = '10000000-0000-0000-0000-00000000000b' $$,
  $$ values ('stakeholder') $$,
  'quem entra por código começa como stakeholder'
);

select public.create_organization('Org da Eve');
select results_eq(
  $$ select m.role::text from public.organization_members m
     join public.organizations o on o.id = m.organization_id
     where o.name = 'Org da Eve' and m.user_id = '00000000-0000-0000-0000-00000000000e' $$,
  $$ values ('admin') $$,
  'quem cria a organização vira admin'
);

-- ---------- visitante sem login ----------
reset role;
set local role anon;
select throws_ok(
  $$ select 1 from public.projects $$,
  '42501', null,
  'visitante sem login não acessa projetos'
);

reset role;
select * from finish();
rollback;
