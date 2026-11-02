-- =====================================================================
-- E7: trilha de auditoria (docs/REGRAS_DE_NEGOCIO.md §7, AU1–AU7) e aviso de
-- dados parciais na sincronização paginada do GitHub (G9)
-- - triggers registram o que o usuário faz pelo app (quem agiu = auth.uid())
-- - a Edge Function `github` registra as ações dela por audit_record (só service_role)
-- - ninguém altera nem apaga um evento; só a exclusão da empresa leva os eventos junto
-- =====================================================================

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- quem agiu; null = Sistema (agendador). O nome e o papel ficam gravados (AU2)
  actor_id uuid references auth.users (id) on delete set null,
  actor_name text not null,
  actor_role text,
  -- ex.: project.created, member.role_changed, github.synced
  action text not null check (action ~ '^[a-z_]+\.[a-z_]+$'),
  entity_type text not null,
  entity_id uuid,
  entity_name text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_events_organization_id_created_at_idx
  on public.audit_events (organization_id, created_at desc);
create index audit_events_actor_id_idx on public.audit_events (actor_id);

-- Só leitura, e só para admin e stakeholder (AU4). Nem a chave de serviço escreve
-- direto: os eventos entram pelas funções abaixo (dono da tabela)
revoke all on public.audit_events from anon, authenticated, service_role;
grant select on public.audit_events to authenticated, service_role;

alter table public.audit_events enable row level security;

create policy "admin e stakeholder veem a auditoria" on public.audit_events
  for select to authenticated
  using (private.has_org_role(organization_id, '{admin,stakeholder}'));

-- ---------------------------------------------------------------------
-- Imutável (AU3). A exceção são as ações em cascata do próprio banco, que rodam
-- dentro de outro trigger (pg_trigger_depth() > 1): excluir a empresa apaga os
-- eventos dela, e excluir uma conta limpa o actor_id (o nome continua)
-- ---------------------------------------------------------------------

create function private.audit_events_immutable()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if pg_trigger_depth() > 1 then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  raise exception 'Eventos de auditoria não podem ser alterados nem apagados.'
    using errcode = '42501';
end;
$$;

create trigger audit_events_immutable
  before update or delete on public.audit_events
  for each row execute function private.audit_events_immutable();

-- ---------------------------------------------------------------------
-- Grava um evento. Quem agiu: o nome vem de profiles e o papel da empresa;
-- `p_actor_role` cobre quem acabou de sair (a linha de membro já não existe)
-- ---------------------------------------------------------------------

create function private.audit_insert(
  p_organization_id uuid,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text,
  p_details jsonb,
  p_actor_role text default null
)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  -- na exclusão da empresa (cascata), não há mais onde registrar
  if not exists (select 1 from public.organizations where id = p_organization_id) then
    return;
  end if;

  insert into public.audit_events
    (organization_id, actor_id, actor_name, actor_role, action, entity_type, entity_id,
     entity_name, details)
  values (
    p_organization_id,
    p_actor_id,
    case
      when p_actor_id is null then 'Sistema'
      else coalesce(
        (select nullif(btrim(full_name), '') from public.profiles where id = p_actor_id),
        'Usuário'
      )
    end,
    coalesce(
      (select role::text from public.organization_members
       where organization_id = p_organization_id and user_id = p_actor_id),
      p_actor_role
    ),
    p_action,
    p_entity_type,
    p_entity_id,
    p_entity_name,
    coalesce(p_details, '{}')
  );
end;
$$;

-- Diferença entre duas versões de uma linha, só nas colunas indicadas:
-- { "coluna": { "from": antes, "to": depois } }
create function private.audit_diff(p_old jsonb, p_new jsonb, p_columns text[])
returns jsonb
language sql immutable set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(column_name, jsonb_build_object('from', p_old -> column_name, 'to', p_new -> column_name)),
    '{}'
  )
  from unnest(p_columns) as column_name
  where (p_old -> column_name) is distinct from (p_new -> column_name)
$$;

-- ---------------------------------------------------------------------
-- Triggers do que o usuário faz pelo app (AU1)
-- ---------------------------------------------------------------------

create function private.audit_project()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_columns text[] := array['name', 'description', 'deadline', 'owner', 'priority', 'progress'];
  v_changes jsonb;
begin
  if tg_op = 'INSERT' then
    perform private.audit_insert(new.organization_id, auth.uid(), 'project.created', 'project',
      new.id, new.name, private.audit_diff('{}', to_jsonb(new), v_columns));
  elsif tg_op = 'UPDATE' then
    v_changes := private.audit_diff(to_jsonb(old), to_jsonb(new), v_columns);
    -- só updated_at ou a coluna antiga de status: não é mudança para auditoria
    if v_changes <> '{}' then
      perform private.audit_insert(new.organization_id, auth.uid(), 'project.updated', 'project',
        new.id, new.name, v_changes);
    end if;
  else
    perform private.audit_insert(old.organization_id, auth.uid(), 'project.deleted', 'project',
      old.id, old.name, '{}');
  end if;

  return null;
end;
$$;

create trigger audit_projects
  after insert or update or delete on public.projects
  for each row execute function private.audit_project();

create function private.audit_member()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_member public.organization_members := case when tg_op = 'DELETE' then old else new end;
  v_name text := (select full_name from public.profiles where id = v_member.user_id);
begin
  if tg_op = 'INSERT' then
    perform private.audit_insert(new.organization_id, auth.uid(), 'member.joined', 'member',
      new.user_id, v_name, jsonb_build_object('role', new.role));
  elsif tg_op = 'UPDATE' then
    if new.role is distinct from old.role then
      perform private.audit_insert(new.organization_id, auth.uid(), 'member.role_changed',
        'member', new.user_id, v_name, jsonb_build_object('from', old.role, 'to', new.role));
    end if;
  else
    perform private.audit_insert(old.organization_id, auth.uid(),
      case when old.user_id = auth.uid() then 'member.left' else 'member.removed' end,
      'member', old.user_id, v_name, jsonb_build_object('role', old.role),
      -- quem saiu sozinho já não tem linha de membro: o papel vem daqui
      case when old.user_id = auth.uid() then old.role::text end);
  end if;

  return null;
end;
$$;

create trigger audit_organization_members
  after insert or update or delete on public.organization_members
  for each row execute function private.audit_member();

create function private.audit_organization()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.name is distinct from old.name then
    perform private.audit_insert(new.id, auth.uid(), 'organization.renamed', 'organization',
      new.id, new.name, jsonb_build_object('from', old.name, 'to', new.name));
  end if;

  -- nunca o código em si (AU1)
  if new.join_code is distinct from old.join_code then
    perform private.audit_insert(new.id, auth.uid(), 'organization.join_code_regenerated',
      'organization', new.id, new.name, '{}');
  end if;

  return null;
end;
$$;

create trigger audit_organizations
  after update on public.organizations
  for each row execute function private.audit_organization();

-- ---------------------------------------------------------------------
-- Ações da Edge Function `github` (chave de serviço: auth.uid() é nulo, então
-- ela informa quem agiu; null = agendador)
-- ---------------------------------------------------------------------

create function public.audit_record(
  p_organization_id uuid,
  p_actor_id uuid,
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_entity_name text,
  p_details jsonb
)
returns void
language sql security invoker set search_path = ''
as $$
  select private.audit_insert(p_organization_id, p_actor_id, p_action, p_entity_type,
    p_entity_id, p_entity_name, p_details)
$$;

revoke all on function
  private.audit_insert(uuid, uuid, text, text, uuid, text, jsonb, text),
  private.audit_diff(jsonb, jsonb, text[]),
  private.audit_project(),
  private.audit_member(),
  private.audit_organization(),
  private.audit_events_immutable(),
  public.audit_record(uuid, uuid, text, text, uuid, text, jsonb)
from public, anon, authenticated;
grant execute on function
  private.audit_insert(uuid, uuid, text, text, uuid, text, jsonb, text),
  public.audit_record(uuid, uuid, text, text, uuid, text, jsonb)
to service_role;

-- ---------------------------------------------------------------------
-- G9: a última sincronização bateu algum teto da paginação?
-- ---------------------------------------------------------------------

alter table public.github_credentials
  add column last_sync_partial boolean not null default false;
grant select (last_sync_partial) on public.github_credentials to authenticated;
