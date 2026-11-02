-- =====================================================================
-- E10: direcionadores estratégicos (docs/REGRAS_DE_NEGOCIO.md §10, S1–S7)
-- - missão e visão na organização (só o admin edita)
-- - objetivos estratégicos (tabela nova) e vínculo opcional do projeto a um objetivo
-- - auditoria dos objetivos, da missão/visão e do vínculo
-- =====================================================================

-- ---------------------------------------------------------------------
-- S1: missão e visão
-- ---------------------------------------------------------------------

alter table public.organizations
  add column mission text not null default '' check (char_length(mission) <= 1000),
  add column vision text not null default '' check (char_length(vision) <= 1000);

-- A policy "admin renomeia a organização" já limita o update ao admin
grant update (mission, vision) on public.organizations to authenticated;

-- ---------------------------------------------------------------------
-- S2: objetivos estratégicos
-- ---------------------------------------------------------------------

create table public.strategic_objectives (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- permite ao projeto garantir que o objetivo é da mesma empresa (chave composta)
  unique (id, organization_id)
);
create index strategic_objectives_organization_id_idx
  on public.strategic_objectives (organization_id);

create trigger strategic_objectives_set_updated_at
  before update on public.strategic_objectives
  for each row execute function private.set_updated_at();

revoke all on public.strategic_objectives from anon;
revoke insert, update on public.strategic_objectives from authenticated;
grant insert (organization_id, title, description) on public.strategic_objectives to authenticated;
grant update (title, description) on public.strategic_objectives to authenticated;

alter table public.strategic_objectives enable row level security;

create policy "membros leem objetivos" on public.strategic_objectives
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "admin cria objetivos" on public.strategic_objectives
  for insert to authenticated
  with check (private.has_org_role(organization_id, array['admin']::public.app_role[]));

create policy "admin edita objetivos" on public.strategic_objectives
  for update to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.app_role[]))
  with check (private.has_org_role(organization_id, array['admin']::public.app_role[]));

create policy "admin exclui objetivos" on public.strategic_objectives
  for delete to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.app_role[]));

-- ---------------------------------------------------------------------
-- S3: vínculo do projeto com um objetivo. A chave composta impede apontar para
-- objetivo de outra empresa; ao excluir o objetivo, só objective_id é zerado
-- ---------------------------------------------------------------------

alter table public.projects add column objective_id uuid;

alter table public.projects
  add constraint projects_objective_fkey
  foreign key (objective_id, organization_id)
  references public.strategic_objectives (id, organization_id)
  on delete set null (objective_id);

create index projects_objective_id_idx on public.projects (objective_id);

-- As policies de projects (admin e developer) já cobrem a nova coluna
grant insert (objective_id) on public.projects to authenticated;
grant update (objective_id) on public.projects to authenticated;

-- ---------------------------------------------------------------------
-- S7: auditoria
-- ---------------------------------------------------------------------

create function private.audit_objective()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_changes jsonb;
begin
  if tg_op = 'INSERT' then
    perform private.audit_insert(new.organization_id, auth.uid(), 'objective.created', 'objective',
      new.id, new.title, '{}');
  elsif tg_op = 'UPDATE' then
    v_changes := private.audit_diff(to_jsonb(old), to_jsonb(new), array['title', 'description']);
    if v_changes <> '{}' then
      perform private.audit_insert(new.organization_id, auth.uid(), 'objective.updated',
        'objective', new.id, new.title, v_changes);
    end if;
  else
    perform private.audit_insert(old.organization_id, auth.uid(), 'objective.deleted',
      'objective', old.id, old.title, '{}');
  end if;

  return null;
end;
$$;

create trigger audit_strategic_objectives
  after insert or update or delete on public.strategic_objectives
  for each row execute function private.audit_objective();

-- Troca de vínculo com o objetivo, com o título (não o id) antes e depois
create function private.audit_objective_link(p_old uuid, p_new uuid)
returns jsonb
language sql stable security definer set search_path = ''
as $$
  select case
    when p_old is not distinct from p_new then '{}'::jsonb
    else jsonb_build_object('objective', jsonb_build_object(
      'from', (select title from public.strategic_objectives where id = p_old),
      'to', (select title from public.strategic_objectives where id = p_new)
    ))
  end
$$;

-- O projeto passa a registrar também o vínculo (mesma função da E7, com a mudança)
create or replace function private.audit_project()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_columns text[] := array['name', 'description', 'deadline', 'owner', 'priority', 'progress'];
  v_changes jsonb;
begin
  if tg_op = 'INSERT' then
    perform private.audit_insert(new.organization_id, auth.uid(), 'project.created', 'project',
      new.id, new.name,
      private.audit_diff('{}', to_jsonb(new), v_columns)
        || private.audit_objective_link(null, new.objective_id));
  elsif tg_op = 'UPDATE' then
    v_changes := private.audit_diff(to_jsonb(old), to_jsonb(new), v_columns)
      || private.audit_objective_link(old.objective_id, new.objective_id);
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

-- Missão e visão alteradas (antes e depois), junto do que a E7 já registra
create or replace function private.audit_organization()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_changes jsonb;
begin
  if new.name is distinct from old.name then
    perform private.audit_insert(new.id, auth.uid(), 'organization.renamed', 'organization',
      new.id, new.name, jsonb_build_object('from', old.name, 'to', new.name));
  end if;

  v_changes := private.audit_diff(to_jsonb(old), to_jsonb(new), array['mission', 'vision']);
  if v_changes <> '{}' then
    perform private.audit_insert(new.id, auth.uid(), 'organization.strategy_updated',
      'organization', new.id, new.name, v_changes);
  end if;

  -- nunca o código em si (AU1)
  if new.join_code is distinct from old.join_code then
    perform private.audit_insert(new.id, auth.uid(), 'organization.join_code_regenerated',
      'organization', new.id, new.name, '{}');
  end if;

  return null;
end;
$$;

revoke all on function
  private.audit_objective(),
  private.audit_objective_link(uuid, uuid)
from public, anon, authenticated;
