-- =====================================================================
-- Histórico de execuções do CI (regra G11): execuções do GitHub Actions dos
-- últimos 90 dias de cada repositório, gravadas pela Edge Function `github` a
-- cada sincronização. LGPD: sem quem disparou a execução.
-- Mesmo modelo das outras tabelas do GitHub: o front só lê, só a Edge Function grava.
-- =====================================================================

create table public.ci_runs (
  id uuid primary key default gen_random_uuid(),
  repository_id uuid not null references public.repositories (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  github_run_id bigint not null,
  run_number integer not null,
  workflow_name text not null,
  event text not null,
  head_branch text,
  head_sha text not null,
  -- queued / in_progress / completed (e outros estados de espera do GitHub)
  status text not null,
  -- só quando concluída: success, failure, cancelled, skipped, timed_out...
  conclusion text,
  html_url text not null,
  started_at timestamptz not null,
  -- fim da execução (updated_at do GitHub quando concluída)
  completed_at timestamptz,
  unique (repository_id, github_run_id)
);
create index ci_runs_organization_id_idx on public.ci_runs (organization_id);

revoke all on public.ci_runs from anon, authenticated;
grant select on public.ci_runs to authenticated;

alter table public.ci_runs enable row level security;

create policy "membros veem as execuções do CI" on public.ci_runs
  for select to authenticated
  using (private.is_org_member(organization_id));
