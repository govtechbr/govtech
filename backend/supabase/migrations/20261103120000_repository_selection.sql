-- =====================================================================
-- E1 (docs/REGRAS_DE_NEGOCIO.md): seleção de repositórios e fim do viewer
--
-- 1. Papel viewer sai: quem era viewer vira stakeholder, e quem entra pelo
--    código passa a entrar como stakeholder (regra A2).
-- 2. Repositório guardado UMA vez por empresa; a ligação com projetos fica em
--    project_repositories (N:N). Assim um repositório pode estar em vários
--    projetos sem contar duas vezes na visão da empresa (G3, G4).
-- 3. Repositório que não está em nenhum projeto é apagado sozinho (G5).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Viewer → stakeholder
-- O Postgres não remove valor de enum com segurança: o valor fica, bloqueado.
-- ---------------------------------------------------------------------

update public.organization_members set role = 'stakeholder' where role = 'viewer';

alter table public.organization_members alter column role set default 'stakeholder';
alter table public.organization_members
  add constraint organization_members_role_not_viewer check (role <> 'viewer');

create or replace function private.join_organization(code text)
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
  values (org_id, (select auth.uid()), 'stakeholder')
  on conflict (organization_id, user_id) do nothing;

  return org_id;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. Repositórios por empresa + ligação com projetos
-- Os dados sincronizados antes desta migration eram por projeto e incluíam os
-- repositórios públicos que a chave enxerga. São cache do GitHub: saem e voltam
-- na próxima sincronização, já com a seleção do admin.
-- ---------------------------------------------------------------------

delete from public.repositories;

alter table public.repositories drop constraint repositories_project_id_github_id_key;
alter table public.repositories drop column project_id;
alter table public.repositories
  add constraint repositories_organization_id_github_id_key unique (organization_id, github_id);

create table public.project_repositories (
  project_id uuid not null references public.projects (id) on delete cascade,
  repository_id uuid not null references public.repositories (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, repository_id)
);
create index project_repositories_repository_id_idx on public.project_repositories (repository_id);
create index project_repositories_organization_id_idx on public.project_repositories (organization_id);

revoke all on public.project_repositories from anon, authenticated;
grant select on public.project_repositories to authenticated;

alter table public.project_repositories enable row level security;

create policy "membros veem os repositórios dos projetos" on public.project_repositories
  for select to authenticated
  using (private.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- 3. Limpeza: repositório sem projeto sai (com PRs e branches, em cascata)
-- Vale para desmarcar, desconectar a chave e excluir o projeto.
-- ---------------------------------------------------------------------

create function private.delete_orphan_repository()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.repositories r
  where r.id = old.repository_id
    and not exists (
      select 1 from public.project_repositories pr where pr.repository_id = old.repository_id
    );
  return old;
end;
$$;

create trigger project_repositories_delete_orphan
  after delete on public.project_repositories
  for each row execute function private.delete_orphan_repository();

-- Desconectar: desfaz as ligações do projeto (a limpeza acima cuida do resto)
-- e apaga a conexão (o trigger da migration github apaga o segredo do Vault)
create or replace function private.github_disconnect(p_project_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.project_repositories where project_id = p_project_id;
  delete from public.github_credentials where project_id = p_project_id;
$$;

revoke all on function private.delete_orphan_repository() from public, anon, authenticated;
