-- =====================================================================
-- core_schema: perfis, organizações, membros e projetos, com RLS
-- Proposta aprovada em docs/PLANO_TECNICO.md §16 (01/11/2026)
-- =====================================================================

-- Papéis dentro de uma organização
create type public.app_role as enum ('admin', 'developer', 'stakeholder', 'viewer');

-- Funções auxiliares ficam num schema que a API não expõe
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  -- código para entrar na organização no cadastro; o admin pode gerar outro
  join_code text not null unique default upper(encode(extensions.gen_random_bytes(5), 'hex')),
  created_at timestamptz not null default now()
);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_id_idx on public.organization_members (user_id);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 2000),
  deadline date,
  -- responsável em texto livre (pode não ter conta no sistema); ver §16.2
  owner text not null default '' check (char_length(owner) <= 120),
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  -- status manual do projeto (Q6); o semáforo de prazo é calculado no front
  status text not null default 'success' check (status in ('success', 'warning', 'danger')),
  progress smallint not null default 0 check (progress between 0 and 100),
  -- vira tabela própria na entrega do GitHub (§16.6)
  repositories text[] not null default '{}',
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_organization_id_idx on public.projects (organization_id);

-- ---------------------------------------------------------------------
-- Funções auxiliares de RLS (security definer: leem membros sem cair na própria RLS)
-- ---------------------------------------------------------------------

create function private.is_org_member(org uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
  );
$$;

create function private.has_org_role(org uuid, roles public.app_role[])
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
      and m.role = any (roles)
  );
$$;

-- o usuário logado e o perfil informado estão em alguma organização em comum?
create function private.shares_org_with(profile_id uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members mine
    join public.organization_members theirs on theirs.organization_id = mine.organization_id
    where mine.user_id = (select auth.uid())
      and theirs.user_id = profile_id
  );
$$;

-- ---------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------

-- cria o perfil quando alguém se cadastra
create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

create function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------
-- Funções chamadas pelo front (RPC): lógica em private, "embrulho" em public
-- ---------------------------------------------------------------------

create function private.create_organization(org_name text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  new_org_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  insert into public.organizations (name) values (btrim(org_name))
  returning id into new_org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org_id, (select auth.uid()), 'admin');

  return new_org_id;
end;
$$;

create function private.join_organization(code text)
returns uuid
language plpgsql security definer set search_path = ''
as $$
declare
  org_id uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'Autenticação necessária.' using errcode = '42501';
  end if;

  select o.id into org_id
  from public.organizations o
  where o.join_code = upper(btrim(code));

  -- mensagem genérica: não revela se a organização existe
  if org_id is null then
    raise exception 'Código de organização inválido.' using errcode = 'P0002';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, (select auth.uid()), 'viewer')
  on conflict (organization_id, user_id) do nothing;

  return org_id;
end;
$$;

create function private.regenerate_join_code(org uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  new_code text;
begin
  if not private.has_org_role(org, array['admin']::public.app_role[]) then
    raise exception 'Apenas o admin pode gerar um novo código.' using errcode = '42501';
  end if;

  update public.organizations
  set join_code = upper(encode(extensions.gen_random_bytes(5), 'hex'))
  where id = org
  returning join_code into new_code;

  return new_code;
end;
$$;

create function public.create_organization(org_name text)
returns uuid
language sql security invoker set search_path = ''
as $$ select private.create_organization(org_name) $$;

create function public.join_organization(code text)
returns uuid
language sql security invoker set search_path = ''
as $$ select private.join_organization(code) $$;

create function public.regenerate_join_code(org uuid)
returns text
language sql security invoker set search_path = ''
as $$ select private.regenerate_join_code(org) $$;

-- Funções: ninguém executa por padrão; só usuários logados, e só o necessário
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function
  private.is_org_member(uuid),
  private.has_org_role(uuid, public.app_role[]),
  private.shares_org_with(uuid),
  private.create_organization(text),
  private.join_organization(text),
  private.regenerate_join_code(uuid)
to authenticated;

revoke all on function
  public.create_organization(text),
  public.join_organization(text),
  public.regenerate_join_code(uuid)
from public, anon;
grant execute on function
  public.create_organization(text),
  public.join_organization(text),
  public.regenerate_join_code(uuid)
to authenticated;

-- ---------------------------------------------------------------------
-- Privilégios de tabela: visitante (anon) não acessa nada; colunas
-- que o cliente não deve escrever (ids, datas, autor, organização) ficam de fora
-- ---------------------------------------------------------------------

revoke all on public.profiles, public.organizations, public.organization_members, public.projects
from anon;

revoke insert, update on public.profiles, public.organizations, public.organization_members
from authenticated;
grant update (full_name) on public.profiles to authenticated;
grant update (name) on public.organizations to authenticated;
grant update (role) on public.organization_members to authenticated;

revoke insert, update on public.projects from authenticated;
grant insert (organization_id, name, description, deadline, owner, priority, status, progress, repositories)
  on public.projects to authenticated;
-- organization_id fora do update: projeto não muda de organização
grant update (name, description, deadline, owner, priority, status, progress, repositories)
  on public.projects to authenticated;

-- ---------------------------------------------------------------------
-- RLS: ligada em todas as tabelas, uma policy por operação
-- ---------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;

-- profiles
create policy "usuário lê o próprio perfil e o de colegas" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_org_with(id));

create policy "usuário edita só o próprio perfil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- organizations (criação só pela função create_organization)
create policy "membros leem a organização" on public.organizations
  for select to authenticated
  using (private.is_org_member(id));

create policy "admin renomeia a organização" on public.organizations
  for update to authenticated
  using (private.has_org_role(id, array['admin']::public.app_role[]))
  with check (private.has_org_role(id, array['admin']::public.app_role[]));

-- organization_members (entrada só pelas funções create/join)
create policy "membros veem os colegas" on public.organization_members
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "admin muda papéis" on public.organization_members
  for update to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.app_role[]))
  with check (private.has_org_role(organization_id, array['admin']::public.app_role[]));

create policy "admin remove membros e membro sai sozinho" on public.organization_members
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['admin']::public.app_role[])
  );

-- projects
create policy "membros leem projetos" on public.projects
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "admin e developer criam projetos" on public.projects
  for insert to authenticated
  with check (private.has_org_role(organization_id, array['admin', 'developer']::public.app_role[]));

create policy "admin e developer editam projetos" on public.projects
  for update to authenticated
  using (private.has_org_role(organization_id, array['admin', 'developer']::public.app_role[]))
  with check (private.has_org_role(organization_id, array['admin', 'developer']::public.app_role[]));

create policy "só admin exclui projetos" on public.projects
  for delete to authenticated
  using (private.has_org_role(organization_id, array['admin']::public.app_role[]));
