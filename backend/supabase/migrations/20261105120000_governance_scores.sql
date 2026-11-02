-- =====================================================================
-- E5: Índice de Governança (docs/REGRAS_DE_NEGOCIO.md §5.1, I1–I6)
-- Uma linha por projeto e por dia (fuso de MS). A Edge Function `github`
-- calcula e grava a cada hora; vale a última apuração do dia. O front só lê.
-- =====================================================================

create table public.governance_scores (
  project_id uuid not null references public.projects (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  day date not null,
  -- null = sem dados (nenhum critério pôde ser calculado)
  score smallint check (score between 0 and 100),
  -- nota de cada critério (0–100 ou null): review, flow, deadline, protection, leadTime
  components jsonb not null,
  -- dia recalculado pelo histórico dos PRs na primeira apuração (I6)
  reconstructed boolean not null default false,
  computed_at timestamptz not null default now(),
  primary key (project_id, day)
);
create index governance_scores_organization_id_idx on public.governance_scores (organization_id);

-- Mesmo modelo das tabelas do GitHub: o front só lê, só a Edge Function grava
revoke all on public.governance_scores from anon, authenticated;
grant select on public.governance_scores to authenticated;

alter table public.governance_scores enable row level security;

create policy "membros veem o índice de governança" on public.governance_scores
  for select to authenticated
  using (private.is_org_member(organization_id));
