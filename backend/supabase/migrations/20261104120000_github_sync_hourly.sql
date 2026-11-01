-- =====================================================================
-- E3: mais dados do GitHub e sincronização a cada hora
-- (docs/REGRAS_DE_NEGOCIO.md G6–G8; docs/PLANO_TECNICO.md §18.8)
-- - PRs: número de aprovações e avatar do autor
-- - commits da branch padrão (últimos 90 dias), sem nome, e-mail nem mensagem
-- - conexão: último erro da sincronização automática
-- - pg_cron chama a Edge Function `github` (ação sync-all) a cada hora, com
--   uma senha gerada aqui dentro do Vault (ninguém a vê)
-- =====================================================================

-- ---------------------------------------------------------------------
-- Dados novos
-- ---------------------------------------------------------------------

alter table public.pull_requests
  add column author_avatar_url text,
  add column approval_count integer not null default 0 check (approval_count >= 0);

create table public.commits (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  sha text not null,
  -- LGPD (G8): só login e avatar públicos do GitHub; nulos quando o e-mail
  -- do commit não tem conta no GitHub
  author_login text,
  author_avatar_url text,
  committed_at timestamptz not null,
  unique (repository_id, sha)
);
create index commits_organization_id_idx on public.commits (organization_id);

alter table public.github_credentials add column last_sync_error text;

-- Mesmo modelo das outras tabelas do GitHub: o front só lê, só a Edge Function grava
revoke all on public.commits from anon, authenticated;
grant select on public.commits to authenticated;
grant select (last_sync_error) on public.github_credentials to authenticated;

alter table public.commits enable row level security;

create policy "membros veem os commits" on public.commits
  for select to authenticated
  using (private.is_org_member(organization_id));

-- ---------------------------------------------------------------------
-- Senha do agendador: gerada aqui, guardada no Vault. A Edge Function a lê
-- pela função abaixo (só a chave de serviço executa) e compara com o cabeçalho.
-- ---------------------------------------------------------------------

select vault.create_secret(
  encode(extensions.gen_random_bytes(32), 'hex'),
  'github_cron_secret',
  'Senha do agendador para a Edge Function github'
);

create function private.github_cron_secret()
returns text
language sql security definer set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'github_cron_secret'
$$;

create function public.github_cron_secret()
returns text
language sql security invoker set search_path = ''
as $$ select private.github_cron_secret() $$;

revoke all on function private.github_cron_secret(), public.github_cron_secret()
from public, anon, authenticated;
grant execute on function private.github_cron_secret(), public.github_cron_secret()
to service_role;

-- ---------------------------------------------------------------------
-- Agendamento: minuto 7 de cada hora (fora da virada, quando há mais tarefas
-- agendadas no mundo). A Edge Function responde na hora e sincroniza depois.
-- ---------------------------------------------------------------------

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

select cron.schedule(
  'github-sync-hourly',
  '7 * * * *',
  $job$
  select net.http_post(
    url := 'https://dulcrbaxzcmfgoikvocl.supabase.co/functions/v1/github',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select private.github_cron_secret())
    ),
    body := '{"action": "sync-all"}'::jsonb,
    timeout_milliseconds := 10000
  )
  $job$
);
