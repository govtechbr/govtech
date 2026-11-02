-- E6: Assistente de Governança com IA (migration assistant_usage)
-- Os limites são passados pequenos para o teste não depender do uso real do dia.
begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(8);

-- ---------- dados de teste (como postgres) ----------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'alice@test.local', '{"full_name":"Alice"}'),
  ('00000000-0000-0000-0000-00000000000b', 'bob@test.local',   '{"full_name":"Bob"}');

-- ---------- servidor (chave de serviço) ----------
set local role service_role;

select results_eq(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000a', 2, 1000000) $$,
  $$ values (1) $$,
  'a primeira pergunta conta e informa quantas restam'
);

select results_eq(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000a', 2, 1000000) $$,
  $$ values (0) $$,
  'a última pergunta do limite ainda passa'
);

select results_eq(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000a', 2, 1000000) $$,
  $$ values (null::integer) $$,
  'passou do limite da pessoa: barra'
);

select results_eq(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000b', 20, 0) $$,
  $$ values (null::integer) $$,
  'limite total do dia barra até quem ainda não perguntou'
);

select results_eq(
  $$ select count from public.assistant_usage
     where user_id = '00000000-0000-0000-0000-00000000000a' $$,
  $$ values (2::smallint) $$,
  'só as perguntas aceitas são contadas'
);

-- ---------- alice logada ----------
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';

select throws_ok(
  $$ select 1 from public.assistant_usage $$,
  '42501', null,
  'ninguém logado lê a contagem de uso'
);

select throws_ok(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000a', 1000, 1000000) $$,
  '42501', null,
  'ninguém logado mexe na própria cota'
);

-- ---------- visitante sem login ----------
set local role anon;

select throws_ok(
  $$ select public.assistant_consume('00000000-0000-0000-0000-00000000000a', 1000, 1000000) $$,
  '42501', null,
  'visitante sem login não usa o assistente'
);

select * from finish();
rollback;
