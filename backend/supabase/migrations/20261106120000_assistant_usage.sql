-- =====================================================================
-- E6: Assistente de Governança com IA (docs/REGRAS_DE_NEGOCIO.md §5.2)
-- - contagem de perguntas por pessoa e por dia (IA3); o texto não é guardado (IA4)
-- - só a Edge Function `assistant` (chave de serviço) conta e consulta
-- =====================================================================

create table public.assistant_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count smallint not null default 0 check (count >= 0),
  primary key (user_id, day)
);
-- a soma do dia (limite total) filtra por `day`
create index assistant_usage_day_idx on public.assistant_usage (day);

-- Ninguém do front lê nem grava: RLS ligada e sem policy
revoke all on public.assistant_usage from anon, authenticated;
alter table public.assistant_usage enable row level security;

-- Conta uma pergunta, se couber nos limites do dia (fuso de MS).
-- Devolve quantas perguntas a pessoa ainda tem hoje, ou null se estourou.
create function private.assistant_consume(p_user_id uuid, p_user_limit integer, p_total_limit integer)
returns integer
language plpgsql security definer set search_path = ''
as $$
declare
  v_day date := (now() at time zone 'America/Campo_Grande')::date;
  v_user integer;
  v_total integer;
begin
  -- uma contagem por vez, para duas perguntas simultâneas não passarem do limite
  perform pg_advisory_xact_lock(hashtext('assistant_usage'));

  select coalesce(sum(count), 0) into v_total from public.assistant_usage where day = v_day;
  select coalesce(max(count), 0) into v_user
  from public.assistant_usage where day = v_day and user_id = p_user_id;

  if v_user >= p_user_limit or v_total >= p_total_limit then
    return null;
  end if;

  insert into public.assistant_usage (user_id, day, count)
  values (p_user_id, v_day, 1)
  on conflict (user_id, day) do update set count = public.assistant_usage.count + 1;

  return p_user_limit - v_user - 1;
end;
$$;

create function public.assistant_consume(p_user_id uuid, p_user_limit integer, p_total_limit integer)
returns integer
language sql security invoker set search_path = ''
as $$ select private.assistant_consume(p_user_id, p_user_limit, p_total_limit) $$;

revoke all on function private.assistant_consume(uuid, integer, integer),
  public.assistant_consume(uuid, integer, integer)
from public, anon, authenticated;
grant execute on function private.assistant_consume(uuid, integer, integer),
  public.assistant_consume(uuid, integer, integer)
to service_role;
