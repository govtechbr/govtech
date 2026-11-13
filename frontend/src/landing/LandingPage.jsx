import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Calculator,
  Check,
  ChevronRight,
  Gauge,
  GitBranch,
  Info,
  KeyRound,
  LayoutDashboard,
  RefreshCw,
  Shield,
  Target,
} from 'lucide-react'

import Brand from '@/shared/ui/Brand'

// Todo texto desta página descreve o que já funciona (docs/REGRAS_DE_NEGOCIO.md).
// Números exibidos são regras do produto (faixas, pesos, limites), nunca dados inventados.

const CAPABILITIES = [
  {
    icon: GitBranch,
    title: 'Integração com o GitHub',
    text: 'O admin conecta uma chave do GitHub somente leitura por projeto e escolhe quais repositórios pertencem a ele. A chave fica guardada no cofre do servidor e nunca volta ao navegador. Cada sincronização lê até 500 repositórios e, por repositório, até 1.000 PRs, numa janela de 90 dias.',
    items: [
      'Repositórios, Pull Requests e aprovações',
      'Branches e proteção da branch principal',
      'Commits da branch principal (90 dias)',
      'Status e histórico do CI (GitHub Actions)',
    ],
  },
  {
    icon: BarChart3,
    title: 'Métricas da Visão geral',
    text: 'Indicadores calculados a partir dos dados sincronizados, com período de 7, 30 ou 90 dias e a regra de cada cálculo explicada na tela.',
    items: [
      'Quantidade de PRs e PRs em risco',
      'Lead time médio e taxa de aprovação',
      'CI verde no merge',
      'Execuções com sucesso e tempo médio de correção',
    ],
  },
  {
    icon: Bell,
    title: 'Alertas e status automático',
    text: 'Os alertas são classificados em Atenção ou Risco e definem o status de cada projeto: Saudável, Atenção ou Risco. Não existe status manual.',
    items: [
      'CI falhando na branch principal ou em PRs',
      'Branch principal sem proteção',
      'PR mergeado sem aprovação',
      'PR aberto parado e prazo do projeto',
    ],
  },
  {
    icon: Gauge,
    title: 'Índice de Governança',
    text: 'Nota de 0 a 100 por projeto e pela empresa, apurada de hora em hora com histórico diário. Os critérios olham os últimos 30 dias.',
    items: [
      'Revisão de código (peso 30)',
      'Fluxo de PRs e prazo (peso 20 cada)',
      'Proteção da branch e lead time (peso 15 cada)',
      'Faixas: Bom, Regular e Crítico',
    ],
  },
  {
    icon: Target,
    title: 'Direcionadores estratégicos',
    text: 'Missão, visão e objetivos estratégicos da empresa ligados aos projetos, mostrando qual meta de negócio uma falha técnica ameaça.',
    items: [
      'Missão, visão e objetivos da empresa',
      'Projeto vinculado a um objetivo',
      'Status do objetivo pelo pior projeto',
      'Alertas que afetam cada objetivo',
    ],
  },
  {
    icon: Shield,
    title: 'Auditoria e controle de acesso',
    text: 'Trilha imutável de quem fez o quê, gravada pelo banco, e acesso por papel garantido por regras de segurança no próprio banco (RLS).',
    items: [
      'Eventos de projetos, membros, empresa e GitHub',
      'Filtros por período e tipo, exportação em CSV',
      'Papéis Admin, Developer e Stakeholder',
      'Várias empresas por pessoa, com código de convite',
    ],
  },
]

const STEPS = [
  {
    icon: KeyRound,
    title: 'Conectar',
    text: 'A pessoa cria a conta e a empresa (ou entra com um código de convite). O admin cadastra os projetos, conecta a chave do GitHub e escolhe os repositórios.',
  },
  {
    icon: RefreshCw,
    title: 'Sincronizar',
    text: 'Os dados do GitHub são buscados automaticamente a cada hora, ou na hora pelo botão Sincronizar.',
  },
  {
    icon: Calculator,
    title: 'Calcular',
    text: 'O sistema calcula métricas, alertas, o status de cada projeto e o Índice de Governança, e grava a nota do dia.',
  },
  {
    icon: LayoutDashboard,
    title: 'Acompanhar',
    text: 'Visão geral, Estratégia, Processos e Auditoria mostram os resultados. Um assistente com IA responde perguntas sobre esses dados.',
  },
]

const PROCESS_AREAS = [
  { area: 'Verificação (VER)', evidence: 'Revisão de código' },
  { area: 'Gestão de Configuração (CM)', evidence: 'Proteção da branch' },
  { area: 'Monitoramento e Controle (PMC)', evidence: 'Fluxo de PRs e prazo' },
  { area: 'Medição e Análise (MA)', evidence: 'Lead time' },
]

const STANDARDS = [
  {
    logo: 'CMMI',
    title: 'CMMI-DEV 1.3',
    text: 'Modelo de maturidade de processos de desenvolvimento. A página Processos agrupa as evidências em quatro de suas áreas.',
    items: [
      'Verificação (VER)',
      'Gestão de Configuração (CM)',
      'Monitoramento e Controle (PMC)',
      'Medição e Análise (MA)',
    ],
  },
  {
    logo: 'SPICE',
    title: 'ISO/IEC 33000 e 12207',
    text: 'SPICE (ISO/IEC 33000) avalia processos definidos na ISO/IEC/IEEE 12207. Cada área de evidência é ligada ao processo correspondente.',
    items: ['Verificação', 'Gestão de configuração', 'Avaliação e controle do projeto', 'Medição'],
  },
  {
    logo: 'COBIT',
    title: 'ISO/IEC 38500 e COBIT',
    text: 'Referências de governança de TI que fundamentam o maior peso dado à revisão de código no Índice de Governança.',
    items: ['Revisão de código como controle central', 'Peso 30 de 100 no índice'],
  },
  {
    logo: 'DORA',
    title: 'Métricas DORA',
    text: 'Métricas de entrega de software usadas como base para medir o tempo das entregas e da recuperação de falhas.',
    items: ['Lead time da abertura ao merge', 'Tempo médio de correção do CI'],
  },
]

const ROLES = [
  { role: 'Admin', can: 'Tudo: projetos, membros, convite e GitHub' },
  { role: 'Developer', can: 'Cria e edita projetos e sincroniza' },
  { role: 'Stakeholder', can: 'Vê tudo, sem alterar' },
]

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Header */}
      <header className="landing-header">
        <div className="container header-content">
          <Brand />

          <nav className="landing-nav">
            <a href="/landing#capabilities" className="nav-link">
              Capacidades
            </a>

            <a href="/landing#how-it-works" className="nav-link">
              Como funciona
            </a>

            <a href="/landing#standards" className="nav-link">
              Referenciais
            </a>

            <a href="/login" className="primary-button small">
              Acessar plataforma
              <ArrowUpRight size={15} />
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-landing container">
        <div className="hero-content">
          <div className="eyebrow">
            <span className="eyebrow-pulse" />
            TCC — GOVERNANÇA DE PROJETOS DE TI
          </div>

          <h1>
            Mais visibilidade para o progresso dos seus projetos
            <span className="title-dot">.</span>
          </h1>

          <p className="hero-description">
            O GovTech lê os dados do GitHub de cada projeto (Pull Requests, branches, commits e CI)
            e os transforma em métricas, alertas, status e um Índice de Governança para apoiar a
            gestão de TI.
          </p>

          <div className="hero-cta">
            <a href="/login" className="primary-button large">
              Acessar plataforma
              <ChevronRight size={18} />
            </a>

            <a href="/cadastro" className="secondary-button large">
              Criar conta
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <strong>0–100</strong>
              <span>Índice de Governança</span>
            </div>

            <div className="stat-item">
              <strong>7</strong>
              <span>Tipos de alerta automático</span>
            </div>

            <div className="stat-item">
              <strong>1 h</strong>
              <span>Sincronização automática</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview elevation-3" aria-hidden="true">
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>

              <span className="preview-title">Faixas do Índice de Governança</span>
            </div>

            <div className="preview-content">
              <div className="preview-summary">
                <div className="summary-card">
                  <span>Bom</span>
                  <strong>≥ 80</strong>
                  <small>Nota de 80 a 100</small>
                </div>

                <div className="summary-card">
                  <span>Regular</span>
                  <strong>60–79</strong>
                  <small>Merece atenção</small>
                </div>

                <div className="summary-card warning">
                  <span>Crítico</span>
                  <strong>&lt; 60</strong>
                  <small>Exige ação</small>
                </div>
              </div>

              <div className="preview-mockup">
                <div className="mockup-sidebar">
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <div className="mockup-main">
                  <div className="mockup-heading" />

                  <div className="mockup-row">
                    <span className="status-dot success" />
                    <div className="mockup-line large" />
                    <div className="mockup-badge success-badge" />
                  </div>

                  <div className="mockup-row">
                    <span className="status-dot warning" />
                    <div className="mockup-line medium" />
                    <div className="mockup-badge warning-badge" />
                  </div>

                  <div className="mockup-row">
                    <span className="status-dot danger" />
                    <div className="mockup-line small" />
                    <div className="mockup-badge danger-badge" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contexto */}
      <section className="context-section">
        <div className="container context-content">
          <div className="context-label">
            <span className="section-tag">O DESAFIO</span>
          </div>

          <div className="context-text">
            <h2>Informações técnicas nem sempre são acessíveis para a gestão</h2>

            <p>
              Pull Requests, revisões, aprovações, branches e execuções do CI registram o andamento
              das entregas, mas esses dados ficam no GitHub, em uma linguagem técnica.
            </p>

            <p>
              O GovTech reúne esses registros e apresenta indicadores e alertas explicados em texto
              simples, para que gestores e profissionais de Governança de TI acompanhem os projetos
              sem precisar conhecer o dia a dia do desenvolvimento.
            </p>
          </div>
        </div>
      </section>

      {/* Capacidades */}
      <section id="capabilities" className="capabilities-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">CAPACIDADES</span>

            <h2>Uma visão consolidada do progresso dos projetos</h2>

            <p className="section-subtitle">
              Tudo o que aparece na plataforma é calculado a partir dos dados sincronizados do
              GitHub e do cadastro dos projetos.
            </p>
          </div>

          <div className="capabilities-grid">
            {CAPABILITIES.map(({ icon: Icon, title, text, items }) => (
              <div key={title} className="capability-card elevation-1">
                <div className="capability-icon">
                  <Icon size={24} />
                </div>

                <h3>{title}</h3>

                <p>{text}</p>

                <ul className="capability-list">
                  {items.map((item) => (
                    <li key={item}>
                      <Check size={14} />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">COMO FUNCIONA</span>

            <h2>Do registro técnico ao indicador de gestão</h2>

            <p className="section-subtitle">
              Quatro passos ligam o trabalho das equipes de desenvolvimento ao acompanhamento da
              Governança de TI.
            </p>
          </div>

          <div className="process-grid">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <article key={title} className="process-step">
                <span className="process-number">{String(index + 1).padStart(2, '0')}</span>

                <div className="process-icon">
                  <Icon size={22} />
                </div>

                <h3>{title}</h3>

                <p>{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Processos */}
      <section className="governance-section">
        <div className="container governance-content">
          <div className="governance-text">
            <span className="section-tag">PROCESSOS</span>

            <h2>Evidências do desenvolvimento para apoiar a avaliação de processos</h2>

            <p>
              A página Processos relaciona os critérios do Índice de Governança a quatro áreas de
              processo do CMMI-DEV 1.3 e aos processos correspondentes da ISO/IEC/IEEE 12207. Cada
              critério alimenta uma única área, então nenhuma evidência é contada duas vezes.
            </p>

            <p>
              Para cada área a tela mostra a nota atual, de onde vem o dado no GitHub e qual prática
              do modelo a evidência apoia.
            </p>

            <div className="governance-points">
              <div className="governance-point">
                <Check size={17} />
                <span>Evidência ligada a um dado verificável do GitHub</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Mesmos pesos e regras do Índice de Governança</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Texto simples para quem não é técnico</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Visível para todos os papéis</span>
              </div>
            </div>
          </div>

          <div className="governance-card elevation-2">
            <div className="governance-card-header">
              <Shield size={20} />
              <span>Áreas de processo e evidências</span>
            </div>

            <div className="governance-card-body">
              {PROCESS_AREAS.map(({ area, evidence }) => (
                <div key={area} className="governance-metric">
                  <div className="metric-label">
                    <span>{area}</span>
                    <strong>{evidence}</strong>
                  </div>
                </div>
              ))}

              <div className="governance-alert">
                <Info size={16} />
                <span>
                  A nota é evidência de apoio, não avaliação formal de maturidade. Atribuir nível de
                  capacidade exige um avaliador qualificado.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Referenciais */}
      <section id="standards" className="standards-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">REFERENCIAIS</span>

            <h2>Modelos que orientam os critérios da plataforma</h2>

            <p className="section-subtitle">
              Estes referenciais embasam o Índice de Governança, as métricas e a página Processos. O
              GovTech fornece evidências de apoio; não certifica conformidade nem atribui nível de
              maturidade.
            </p>
          </div>

          <div className="standards-grid">
            {STANDARDS.map(({ logo, title, text, items }) => (
              <div key={title} className="standard-card elevation-1">
                <div className="standard-logo">{logo}</div>

                <h3>{title}</h3>

                <p>{text}</p>

                <ul className="standard-list">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="demo-cta-section">
        <div className="container">
          <div className="demo-content elevation-2">
            <div className="demo-text">
              <span className="section-tag">COMECE AGORA</span>

              <h2>Acompanhe seus projetos com mais clareza</h2>

              <p>
                Crie sua conta, cadastre a empresa e conecte os repositórios do GitHub. O cadastro é
                aberto, e quem entra com o código de convite de uma empresa começa como Stakeholder.
              </p>

              <div className="demo-features">
                <div className="demo-feature">
                  <Check size={18} />
                  <span>Visão geral com métricas e alertas</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Índice de Governança com histórico</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Estratégia, Processos e Auditoria</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Assistente com IA sobre os dados</span>
                </div>
              </div>

              <a href="/cadastro" className="primary-button large">
                Criar conta
                <ChevronRight size={18} />
              </a>
            </div>

            <div className="demo-visual">
              <div className="demo-card">
                <div className="demo-card-header">
                  <span>Papéis de acesso</span>
                </div>

                <div className="demo-card-body">
                  {ROLES.map(({ role, can }) => (
                    <div key={role} className="demo-input">
                      <span>
                        <strong>{role}:</strong> {can}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container footer-content">
          <div className="footer-brand">
            <Brand />

            <p>
              Plataforma de governança de projetos de TI baseada nos dados do GitHub, com métricas,
              alertas, Índice de Governança e auditoria.
            </p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h4>Plataforma</h4>

              <a href="/landing#capabilities">Capacidades</a>
              <a href="/landing#how-it-works">Como funciona</a>
              <a href="/landing#standards">Referenciais</a>
            </div>

            <div className="footer-column">
              <h4>Acesso</h4>

              <a href="/login">Entrar</a>
              <a href="/cadastro">Criar conta</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p>© 2026 GovTech. Projeto acadêmico (TCC) de governança de projetos de TI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
