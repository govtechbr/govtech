-- =====================================================================
-- Os repositórios de um projeto passam a vir do GitHub (decisão G3, §18.2).
-- Migration separada da `github` de propósito: aplicar SÓ DEPOIS do merge do
-- front que parou de ler esta coluna, senão o site em produção quebra.
-- =====================================================================

alter table public.projects drop column repositories;
