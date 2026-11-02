import { SCORE_CRITERIA } from '@/shared/lib/governanceScore'

// Áreas de processo que os critérios do Índice de Governança evidenciam
// (docs/REGRAS_DE_NEGOCIO.md §11, C2). Cada critério alimenta uma única área, então
// nenhuma evidência é contada duas vezes. É um mapa de leitura: mudar esta tabela não
// muda o índice nem os alertas (C6), e o sistema não avalia maturidade (C5).
export const PROCESS_AREAS = [
  {
    key: 'ver',
    code: 'VER',
    name: 'Verificação',
    iso: 'Verificação',
    criteria: ['review'],
    practice:
      'Revisão por pares dos produtos de trabalho: o código só entra depois que outra pessoa o aprova.',
    source: 'Aprovações registradas nos Pull Requests mergeados.',
  },
  {
    key: 'cm',
    code: 'CM',
    name: 'Gestão de Configuração',
    iso: 'Gestão de configuração',
    criteria: ['protection'],
    practice:
      'Controle das linhas-base: a branch principal só muda por PR revisado, sem push direto.',
    source: 'Proteção da branch principal de cada repositório, lida do GitHub.',
  },
  {
    key: 'pmc',
    code: 'PMC',
    name: 'Monitoramento e Controle do Projeto',
    iso: 'Avaliação e controle do projeto',
    criteria: ['flow', 'deadline'],
    practice: 'Acompanhar o andamento contra o plano e agir sobre os desvios.',
    source: 'Tempo de espera dos PRs abertos e prazo cadastrado de cada projeto.',
  },
  {
    key: 'ma',
    code: 'MA',
    name: 'Medição e Análise',
    iso: 'Medição',
    criteria: ['leadTime'],
    practice: 'Medir o tempo de entrega e usar a medida para decidir.',
    source: 'Mediana do tempo entre abrir e mergear cada PR.',
  },
]

// Critérios da área com a nota atual da empresa (null = sem dado, regra I2)
export function areaCriteria(area, components = {}) {
  return SCORE_CRITERIA.filter(({ key }) => area.criteria.includes(key)).map((criterion) => ({
    ...criterion,
    score: components[criterion.key] ?? null,
  }))
}

// Regra C3: média ponderada só dos critérios com dado; sem nenhum, null
export function areaScore(area, components = {}) {
  const withData = areaCriteria(area, components).filter(({ score }) => score !== null)
  const weight = withData.reduce((total, criterion) => total + criterion.weight, 0)

  if (weight === 0) return null

  return Math.round(
    withData.reduce((total, criterion) => total + criterion.score * criterion.weight, 0) / weight,
  )
}
