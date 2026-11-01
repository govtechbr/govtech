-- =====================================================================
-- Seed de demonstração: organização "GovTech MS (demo)" com os 4 projetos
-- que hoje estão em frontend/src/mocks/mockData.js.
--
-- Rodar DEPOIS que a conta do admin existir (cadastro feito no app).
-- Antes de rodar, trocar ADMIN_EMAIL_AQUI pelo e-mail da conta.
-- Idempotente: rodar de novo não duplica nada.
-- =====================================================================

do $$
declare
  admin_email constant text := 'ADMIN_EMAIL_AQUI';
  admin_id uuid;
  org_id uuid;
begin
  select id into admin_id from auth.users where email = admin_email;

  if admin_id is null then
    raise exception 'Conta % não encontrada: faça o cadastro no app antes do seed.', admin_email;
  end if;

  select o.id into org_id
  from public.organizations o
  join public.organization_members m on m.organization_id = o.id
  where o.name = 'GovTech MS (demo)' and m.user_id = admin_id and m.role = 'admin';

  if org_id is not null then
    raise notice 'Organização demo já existe (%); nada a fazer.', org_id;
    return;
  end if;

  insert into public.organizations (name) values ('GovTech MS (demo)') returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, admin_id, 'admin');

  insert into public.projects
    (organization_id, name, description, deadline, owner, priority, status, progress, repositories, created_by)
  values
    (org_id, 'Plataforma de Pagamentos', 'Implementação de um novo gateway de pagamentos para e-commerce.',
     '2026-10-25', 'Marina Costa', 'high', 'danger', 68, array['identity-gateway', 'billing-orchestrator'], admin_id),
    (org_id, 'Sistema de Notificações', 'Central de notificações push e e-mail para usuários da plataforma.',
     '2026-10-04', 'Carlos Melo', 'medium', 'warning', 45, array['notification-hub'], admin_id),
    (org_id, 'Dashboard Analítico', 'Painel de métricas operacionais, indicadores de negócio e KPIs.',
     '2026-11-15', 'Ana Silva', 'medium', 'success', 82, array['observability-api'], admin_id),
    (org_id, 'Refatoração User Service', 'Melhoria de performance, segurança e escalabilidade do serviço.',
     '2026-09-10', 'João Santos', 'low', 'danger', 35, array['identity-gateway'], admin_id);

  raise notice 'Organização demo criada: %', org_id;
end;
$$;
