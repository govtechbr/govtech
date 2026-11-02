-- Status do CI (regra G10): resultado combinado dos checks do último commit de
-- cada PR e da branch principal, gravado pela Edge Function `github` a cada
-- sincronização. null = repositório sem CI (ou chave sem permissão de lê-lo).
-- Leitura pelos grants de tabela já existentes; RLS e policies não mudam.

alter table public.pull_requests
  add column ci_state text check (ci_state in ('success', 'failure', 'pending'));

alter table public.repositories
  add column ci_state text check (ci_state in ('success', 'failure', 'pending'));
