-- =====================================================================
-- Integração com o GitHub (docs/PLANO_TECNICO.md §18)
-- Uma chave por projeto, guardada no Vault. Só a Edge Function `github`
-- (com a chave de serviço) grava e lê a chave e os dados sincronizados;
-- o front só lê os dados, filtrados por organização (RLS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabelas
-- ---------------------------------------------------------------------

create table public.github_credentials (
  project_id uuid primary key references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- referência ao segredo em vault.secrets; a chave em si nunca fica aqui
  secret_id uuid not null,
  token_last4 text not null check (char_length(token_last4) = 4),
  github_login text not null,
  last_synced_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index github_credentials_organization_id_idx on public.github_credentials (organization_id);

create table public.repositories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  github_id bigint not null,
  full_name text not null,
  name text not null,
  description text,
  language text,
  default_branch text,
  html_url text not null,
  private boolean not null default false,
  pushed_at timestamptz,
  synced_at timestamptz not null default now(),
  unique (project_id, github_id)
);
create index repositories_organization_id_idx on public.repositories (organization_id);

create table public.pull_requests (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  number integer not null,
  title text not null,
  state text not null check (state in ('open', 'closed', 'merged')),
  draft boolean not null default false,
  author_login text,
  html_url text not null,
  created_at_github timestamptz not null,
  updated_at_github timestamptz not null,
  merged_at timestamptz,
  closed_at timestamptz,
  unique (repository_id, number)
);
create index pull_requests_organization_id_idx on public.pull_requests (organization_id);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  last_commit_sha text not null,
  protected boolean not null default false,
  unique (repository_id, name)
);
create index branches_organization_id_idx on public.branches (organization_id);

-- ---------------------------------------------------------------------
-- Privilégios: o front (authenticated) só lê; anon não acessa nada.
-- Em github_credentials, o front lê só colunas sem relação com o segredo.
-- ---------------------------------------------------------------------

revoke all on public.github_credentials, public.repositories, public.pull_requests, public.branches
from anon, authenticated;

grant select (project_id, organization_id, token_last4, github_login, last_synced_at, created_at)
  on public.github_credentials to authenticated;
grant select on public.repositories, public.pull_requests, public.branches to authenticated;

-- ---------------------------------------------------------------------
-- RLS: membros leem os dados da própria organização. Sem policy de escrita:
-- a Edge Function usa a chave de serviço, que ignora RLS.
-- ---------------------------------------------------------------------

alter table public.github_credentials enable row level security;
alter table public.repositories enable row level security;
alter table public.pull_requests enable row level security;
alter table public.branches enable row level security;

create policy "membros veem a conexão do GitHub" on public.github_credentials
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "membros veem os repositórios" on public.repositories
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "membros veem os PRs" on public.pull_requests
  for select to authenticated
  using (private.is_org_member(organization_id));

create policy "membros veem as branches" on public.branches
  for select to authenticated
  using (private.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- Vault: gravar, ler e apagar a chave de um projeto.
-- Lógica em private (security definer); a API só expõe public, então há
-- "embrulhos" em public que SÓ a chave de serviço pode executar.
-- ---------------------------------------------------------------------

create function private.github_save_token(
  p_project_id uuid, p_token text, p_github_login text, p_user_id uuid
)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_organization_id uuid;
  v_secret_id uuid;
begin
  select organization_id into v_organization_id
  from public.projects where id = p_project_id;

  if v_organization_id is null then
    raise exception 'Projeto não encontrado.';
  end if;

  select secret_id into v_secret_id
  from public.github_credentials where project_id = p_project_id;

  if v_secret_id is null then
    v_secret_id := vault.create_secret(p_token, 'github:' || p_project_id, 'Chave do GitHub do projeto');
  else
    perform vault.update_secret(v_secret_id, p_token);
  end if;

  insert into public.github_credentials
    (project_id, organization_id, secret_id, token_last4, github_login, created_by)
  values
    (p_project_id, v_organization_id, v_secret_id, right(p_token, 4), p_github_login, p_user_id)
  on conflict (project_id) do update
    set token_last4 = excluded.token_last4,
        github_login = excluded.github_login,
        created_by = excluded.created_by,
        created_at = now();
end;
$$;

create function private.github_read_token(p_project_id uuid)
returns text
language sql security definer set search_path = ''
as $$
  select s.decrypted_secret
  from public.github_credentials c
  join vault.decrypted_secrets s on s.id = c.secret_id
  where c.project_id = p_project_id
$$;

-- Apaga a conexão e os dados sincronizados; o segredo sai pelo trigger abaixo
create function private.github_disconnect(p_project_id uuid)
returns void
language sql security definer set search_path = ''
as $$
  delete from public.repositories where project_id = p_project_id;
  delete from public.github_credentials where project_id = p_project_id;
$$;

-- Ao apagar a conexão (inclusive quando o projeto é excluído), o segredo
-- também sai do Vault
create function private.github_delete_secret()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from vault.secrets where id = old.secret_id;
  return old;
end;
$$;

create trigger github_credentials_delete_secret
  after delete on public.github_credentials
  for each row execute function private.github_delete_secret();

create function public.github_save_token(
  p_project_id uuid, p_token text, p_github_login text, p_user_id uuid
)
returns void
language sql security invoker set search_path = ''
as $$ select private.github_save_token(p_project_id, p_token, p_github_login, p_user_id) $$;

create function public.github_read_token(p_project_id uuid)
returns text
language sql security invoker set search_path = ''
as $$ select private.github_read_token(p_project_id) $$;

create function public.github_disconnect(p_project_id uuid)
returns void
language sql security invoker set search_path = ''
as $$ select private.github_disconnect(p_project_id) $$;

-- Só a chave de serviço (Edge Function) executa; ninguém logado chama
revoke all on function
  private.github_save_token(uuid, text, text, uuid),
  private.github_read_token(uuid),
  private.github_disconnect(uuid),
  private.github_delete_secret(),
  public.github_save_token(uuid, text, text, uuid),
  public.github_read_token(uuid),
  public.github_disconnect(uuid)
from public, anon, authenticated;

grant usage on schema private to service_role;
grant execute on function
  private.github_save_token(uuid, text, text, uuid),
  private.github_read_token(uuid),
  private.github_disconnect(uuid),
  public.github_save_token(uuid, text, text, uuid),
  public.github_read_token(uuid),
  public.github_disconnect(uuid)
to service_role;
