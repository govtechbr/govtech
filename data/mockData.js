export const profile = {
  name: 'Marina Costa',
  role: 'Platform Engineering',
  initials: 'MC',
}

export const services = [
  {
    name: 'identity-gateway',
    team: 'Core Platform',
    language: 'Go',
    version: 'v2.18.4',
    deploy: 'healthy',
    updated: 'há 8 min',
  },
  {
    name: 'billing-orchestrator',
    team: 'Commerce',
    language: 'TypeScript',
    version: 'v4.06.1',
    deploy: 'healthy',
    updated: 'há 21 min',
  },
  {
    name: 'notification-hub',
    team: 'Customer Ops',
    language: 'Kotlin',
    version: 'v1.12.0',
    deploy: 'pending',
    updated: 'há 42 min',
  },
  {
    name: 'observability-api',
    team: 'SRE',
    language: 'Python',
    version: 'v3.02.8',
    deploy: 'attention',
    updated: 'há 1h',
  },
]

export const repoStats = {
  repositories: 4,
  commits: 1842,
  branches: 64,
  contributors: 37,
}

export const projects = [
  {
    id: 1,
    name: 'Plataforma de Pagamentos',
    description:
      'Implementação de um novo gateway de pagamentos para e-commerce.',
    deadline: '2026-10-25',
    owner: 'Marina Costa',
    priority: 'high',
    progress: 68,
    repositories: ['identity-gateway', 'billing-orchestrator'],
  },
  {
    id: 2,
    name: 'Sistema de Notificações',
    description:
      'Central de notificações push e e-mail para usuários da plataforma.',
    deadline: '2026-10-04',
    owner: 'Carlos Melo',
    priority: 'medium',
    progress: 45,
    repositories: ['notification-hub'],
  },
  {
    id: 3,
    name: 'Dashboard Analítico',
    description:
      'Painel de métricas operacionais, indicadores de negócio e KPIs.',
    deadline: '2026-11-15',
    owner: 'Ana Silva',
    priority: 'medium',
    progress: 82,
    repositories: ['observability-api'],
  },
  {
    id: 4,
    name: 'Refatoração User Service',
    description:
      'Melhoria de performance, segurança e escalabilidade do serviço.',
    deadline: '2026-09-10',
    owner: 'João Santos',
    priority: 'low',
    progress: 35,
    repositories: ['identity-gateway'],
  },
]

export const pullRequests = [
  {
    id: 856,
    title: 'feature/payment-gateway',
    author: 'ana.silva',
    repository: 'identity-gateway',
    status: 'open',
    createdAt: '8 min atrás',
    commits: 3,
    reviewers: ['carlos.melo', 'marina.costa'],
    labels: ['feature', 'backend'],
    description:
      'Implementa integração inicial para o gateway externo de pagamentos.',
  },
  {
    id: 842,
    title: 'fix/billing-logic',
    author: 'carlos.melo',
    repository: 'billing-orchestrator',
    status: 'in_review',
    createdAt: '5 dias atrás',
    commits: 5,
    reviewers: ['marina.costa'],
    labels: ['bugfix', 'billing'],
    description:
      'Corrige inconsistências identificadas no cálculo de faturamento.',
  },
  {
    id: 838,
    title: 'feat/notification-preferences',
    author: 'ana.silva',
    repository: 'notification-hub',
    status: 'approved',
    createdAt: '2 dias atrás',
    commits: 4,
    reviewers: ['carlos.melo'],
    labels: ['feature', 'notifications'],
    description:
      'Cria preferências de notificação para usuários da plataforma.',
  },
  {
    id: 830,
    title: 'refactor/metrics-endpoints',
    author: 'joao.santos',
    repository: 'observability-api',
    status: 'merged',
    createdAt: '1 dia atrás',
    commits: 2,
    reviewers: ['ana.silva'],
    labels: ['refactor', 'observability'],
    description:
      'Refatora endpoints responsáveis pela consulta de métricas operacionais.',
  },
]

export const branches = [
  {
    name: 'main',
    repository: 'identity-gateway',
    lastCommit: 'há 8 min',
    commits: 234,
    author: 'ana.silva',
    status: 'active',
  },
  {
    name: 'feature/payment-gateway',
    repository: 'identity-gateway',
    lastCommit: 'há 8 min',
    commits: 12,
    author: 'ana.silva',
    status: 'active',
  },
  {
    name: 'fix/billing-logic',
    repository: 'billing-orchestrator',
    lastCommit: 'há 2h',
    commits: 8,
    author: 'carlos.melo',
    status: 'active',
  },
  {
    name: 'feature/discount-rules',
    repository: 'billing-orchestrator',
    lastCommit: 'há 18 dias',
    commits: 5,
    author: 'joao.santos',
    status: 'stale',
  },
  {
    name: 'main',
    repository: 'notification-hub',
    lastCommit: 'há 42 min',
    commits: 156,
    author: 'carlos.melo',
    status: 'active',
  },
  {
    name: 'feature/push-preferences',
    repository: 'notification-hub',
    lastCommit: 'há 10 dias',
    commits: 9,
    author: 'ana.silva',
    status: 'stale',
  },
  {
    name: 'main',
    repository: 'observability-api',
    lastCommit: 'há 1h',
    commits: 189,
    author: 'joao.santos',
    status: 'active',
  },
]

export const auditEvents = [
  {
    action: 'Deploy aprovado',
    service: 'identity-gateway',
    actor: 'ana.silva',
    hash: 'a82f91c0…7d2e',
    time: '09:42:18',
    status: 'success',
  },
  {
    action: 'Política alterada',
    service: 'billing-orchestrator',
    actor: 'carlos.melo',
    hash: '0f4a2b31…9c1b',
    time: '09:31:06',
    status: 'info',
  },
  {
    action: 'Falha de pipeline',
    service: 'observability-api',
    actor: 'ci/github-actions',
    hash: 'd9317e8a…4fe0',
    time: '08:57:44',
    status: 'danger',
  },
  {
    action: 'Acesso concedido',
    service: 'notification-hub',
    actor: 'marina.costa',
    hash: 'b11caa4d…0ef1',
    time: '08:44:21',
    status: 'warning',
  },
]

export const accessRoles = [
  {
    label: 'Admin',
    icon: 'Shield',
    description: 'Acesso total, políticas e RBAC.',
  },
  {
    label: 'Developer',
    icon: 'Code2',
    description: 'Pipelines, releases e serviços.',
  },
  {
    label: 'Stakeholder',
    icon: 'BriefcaseBusiness',
    description: 'KPIs e relatórios executivos.',
  },
  {
    label: 'Viewer',
    icon: 'Eye',
    description: 'Consulta de status e auditoria.',
  },
]