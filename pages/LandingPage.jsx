import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Check,
  ChevronRight,
  FileCheck,
  Gauge,
  GitBranch,
  RefreshCw,
  Shield,
  Users,
  Workflow,
} from 'lucide-react'

import Brand from '../components/common/Brand'

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
            TCC — GOVERNANÇA E MONITORAMENTO DE TI
          </div>

          <h1>
            Mais visibilidade para o progresso dos seus projetos
            <span className="title-dot">.</span>
          </h1>

          <p className="hero-description">
            Transforme os dados das Pull Requests em informações claras para
            acompanhar entregas, identificar riscos e apoiar decisões de
            Governança de Tecnologia da Informação.
          </p>

          <div className="hero-cta">
            <a href="/login" className="primary-button large">
              Acessar plataforma
              <ChevronRight size={18} />
            </a>

            <a href="/landing#how-it-works" className="secondary-button large">
              Conhecer a solução
            </a>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <strong>GitHub</strong>
              <span>Integração com repositórios</span>
            </div>

            <div className="stat-item">
              <strong>PRs</strong>
              <span>Monitoramento das entregas</span>
            </div>

            <div className="stat-item">
              <strong>KPIs</strong>
              <span>Indicadores para gestão</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview elevation-3">
            <div className="preview-header">
              <div className="preview-dots">
                <span className="dot" />
                <span className="dot" />
                <span className="dot" />
              </div>

              <span className="preview-title">
                Governança de Projetos de TI
              </span>
            </div>

            <div className="preview-content">
              <div className="preview-summary">
                <div className="summary-card">
                  <span>Projetos monitorados</span>
                  <strong>12</strong>
                  <small>Em acompanhamento</small>
                </div>

                <div className="summary-card">
                  <span>Pull Requests</span>
                  <strong>48</strong>
                  <small>Ativas no período</small>
                </div>

                <div className="summary-card warning">
                  <span>Pontos de atenção</span>
                  <strong>05</strong>
                  <small>Exigem acompanhamento</small>
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
            <h2>
              Informações técnicas nem sempre são acessíveis para a gestão
            </h2>

            <p>
              As equipes de desenvolvimento produzem informações importantes
              durante o ciclo de vida dos projetos. Pull Requests, revisões,
              aprovações, branches e pipelines registram o andamento das
              entregas, mas esses dados normalmente ficam dispersos em
              ferramentas técnicas.
            </p>

            <p>
              A solução centraliza essas informações e apresenta indicadores
              mais simples para profissionais de gestão e Governança de TI,
              mesmo quando não possuem conhecimento aprofundado em
              desenvolvimento de software.
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
              A plataforma organiza dados técnicos e transforma registros do
              desenvolvimento em informações úteis para acompanhamento,
              controle e tomada de decisão.
            </p>
          </div>

          <div className="capabilities-grid">
            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <GitBranch size={24} />
              </div>

              <h3>Monitoramento de Pull Requests</h3>

              <p>
                Acompanhe solicitações de integração, revisões, aprovações e
                estados das entregas realizadas pelas equipes.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Pull Requests abertas e encerradas
                </li>
                <li>
                  <Check size={14} />
                  Status de revisão e aprovação
                </li>
                <li>
                  <Check size={14} />
                  Identificação de atividades pendentes
                </li>
                <li>
                  <Check size={14} />
                  Histórico das alterações
                </li>
              </ul>
            </div>

            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <Workflow size={24} />
              </div>

              <h3>Integração com GitHub</h3>

              <p>
                Consulte informações dos repositórios monitorados por meio da
                API do GitHub e acompanhe o fluxo de desenvolvimento.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Repositórios e branches
                </li>
                <li>
                  <Check size={14} />
                  Dados das Pull Requests
                </li>
                <li>
                  <Check size={14} />
                  Informações das equipes
                </li>
                <li>
                  <Check size={14} />
                  Atualização das atividades
                </li>
              </ul>
            </div>

            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <RefreshCw size={24} />
              </div>

              <h3>Automação com GitHub Actions</h3>

              <p>
                Automatize verificações e análises para reduzir a necessidade de
                acompanhamento manual das informações.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Execução automatizada
                </li>
                <li>
                  <Check size={14} />
                  Coleta periódica de dados
                </li>
                <li>
                  <Check size={14} />
                  Análise de condições definidas
                </li>
                <li>
                  <Check size={14} />
                  Apoio ao monitoramento contínuo
                </li>
              </ul>
            </div>

            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <BarChart3 size={24} />
              </div>

              <h3>Indicadores de Governança</h3>

              <p>
                Visualize métricas que ajudam a compreender o andamento dos
                projetos e a identificar tendências ou desvios.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Indicadores de progresso
                </li>
                <li>
                  <Check size={14} />
                  Frequência de entregas
                </li>
                <li>
                  <Check size={14} />
                  Lead time e tempo de revisão
                </li>
                <li>
                  <Check size={14} />
                  Taxas de falha e atenção
                </li>
              </ul>
            </div>

            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <Bell size={24} />
              </div>

              <h3>Alertas e Pontos de Atenção</h3>

              <p>
                Identifique situações que podem impactar prazos, entregas ou a
                conformidade dos processos de desenvolvimento.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Pull Requests antigas
                </li>
                <li>
                  <Check size={14} />
                  Atrasos em aprovações
                </li>
                <li>
                  <Check size={14} />
                  Falhas em pipelines
                </li>
                <li>
                  <Check size={14} />
                  Riscos e desvios de processo
                </li>
              </ul>
            </div>

            <div className="capability-card elevation-1">
              <div className="capability-icon">
                <Shield size={24} />
              </div>

              <h3>Rastreabilidade e Auditoria</h3>

              <p>
                Mantenha o histórico dos eventos relevantes para apoiar
                auditorias, controles internos e a melhoria dos processos.
              </p>

              <ul className="capability-list">
                <li>
                  <Check size={14} />
                  Registro de eventos críticos
                </li>
                <li>
                  <Check size={14} />
                  Aprovações e alterações
                </li>
                <li>
                  <Check size={14} />
                  Rastreabilidade das atividades
                </li>
                <li>
                  <Check size={14} />
                  Exportação das informações
                </li>
              </ul>
            </div>
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
              A solução conecta as atividades realizadas pelas equipes de
              desenvolvimento às necessidades de acompanhamento da Governança
              de TI.
            </p>
          </div>

          <div className="process-grid">
            <article className="process-step">
              <span className="process-number">01</span>

              <div className="process-icon">
                <GitBranch size={22} />
              </div>

              <h3>Coleta</h3>

              <p>
                As informações das Pull Requests e dos repositórios são
                consultadas por meio da API do GitHub.
              </p>
            </article>

            <article className="process-step">
              <span className="process-number">02</span>

              <div className="process-icon">
                <RefreshCw size={22} />
              </div>

              <h3>Automação</h3>

              <p>
                O GitHub Actions executa as rotinas de verificação e análise
                conforme as condições definidas.
              </p>
            </article>

            <article className="process-step">
              <span className="process-number">03</span>

              <div className="process-icon">
                <Gauge size={22} />
              </div>

              <h3>Análise</h3>

              <p>
                Os dados são organizados em indicadores, classificações e
                situações que merecem acompanhamento.
              </p>
            </article>

            <article className="process-step">
              <span className="process-number">04</span>

              <div className="process-icon">
                <Bell size={22} />
              </div>

              <h3>Acompanhamento</h3>

              <p>
                Gestores e profissionais de Governança visualizam alertas e
                informações para apoiar a tomada de decisão.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* Governança */}
      <section className="governance-section">
        <div className="container governance-content">
          <div className="governance-text">
            <span className="section-tag">GOVERNANÇA DE TI</span>

            <h2>Evidências do desenvolvimento para apoiar a gestão</h2>

            <p>
              As atividades registradas durante o desenvolvimento podem ser
              utilizadas como evidências para o acompanhamento dos processos,
              identificação de pontos de melhoria e controle dos riscos.
            </p>

            <p>
              A proposta também busca aproximar os registros técnicos dos
              critérios de avaliação de processos relacionados ao SPICE/MMI,
              contribuindo para uma visão mais estruturada da evolução dos
              projetos.
            </p>

            <div className="governance-points">
              <div className="governance-point">
                <Check size={17} />
                <span>Maior visibilidade do andamento dos projetos</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Redução do acompanhamento manual</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Identificação antecipada de riscos</span>
              </div>

              <div className="governance-point">
                <Check size={17} />
                <span>Suporte à melhoria contínua dos processos</span>
              </div>
            </div>
          </div>

          <div className="governance-card elevation-2">
            <div className="governance-card-header">
              <Shield size={20} />
              <span>Visão de Governança</span>
            </div>

            <div className="governance-card-body">
              <div className="governance-metric">
                <div className="metric-label">
                  <span>Progresso do projeto</span>
                  <strong>78%</strong>
                </div>

                <div className="metric-bar">
                  <span style={{ width: '78%' }} />
                </div>
              </div>

              <div className="governance-metric">
                <div className="metric-label">
                  <span>Pull Requests revisadas</span>
                  <strong>86%</strong>
                </div>

                <div className="metric-bar">
                  <span style={{ width: '86%' }} />
                </div>
              </div>

              <div className="governance-metric">
                <div className="metric-label">
                  <span>Processos sem alerta</span>
                  <strong>92%</strong>
                </div>

                <div className="metric-bar">
                  <span style={{ width: '92%' }} />
                </div>
              </div>

              <div className="governance-alert">
                <Bell size={16} />
                <span>3 pontos de atenção identificados no período</span>
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

            <h2>
              Baseado em práticas de governança, processos e segurança
            </h2>

            <p className="section-subtitle">
              A proposta considera referências utilizadas para estruturar a
              governança, o gerenciamento de serviços, a segurança da
              informação e a avaliação dos processos.
            </p>
          </div>

          <div className="standards-grid">
            <div className="standard-card elevation-1">
              <div className="standard-logo">SPICE/MMI</div>

              <h3>SPICE/MMI</h3>

              <p>
                Referencial para avaliação, acompanhamento e melhoria dos
                processos de desenvolvimento.
              </p>

              <ul className="standard-list">
                <li>Avaliação de processos</li>
                <li>Evidências do desenvolvimento</li>
                <li>Melhoria contínua</li>
              </ul>
            </div>

            <div className="standard-card elevation-1">
              <div className="standard-logo">COBIT</div>

              <h3>COBIT</h3>

              <p>
                Referência para governança e gestão de Tecnologia da Informação
                alinhada aos objetivos organizacionais.
              </p>

              <ul className="standard-list">
                <li>Gestão de riscos</li>
                <li>Alinhamento estratégico</li>
                <li>Monitoramento e controle</li>
              </ul>
            </div>

            <div className="standard-card elevation-1">
              <div className="standard-logo">ITIL</div>

              <h3>ITIL</h3>

              <p>
                Práticas para gerenciamento de serviços, mudanças e melhoria
                contínua no ambiente de TI.
              </p>

              <ul className="standard-list">
                <li>Gestão de mudanças</li>
                <li>Gestão de incidentes</li>
                <li>Melhoria contínua</li>
              </ul>
            </div>

            <div className="standard-card elevation-1">
              <div className="standard-logo">ISO</div>

              <h3>ISO/IEC 38500</h3>

              <p>
                Referência para a governança corporativa da Tecnologia da
                Informação.
              </p>

              <ul className="standard-list">
                <li>Uso responsável da TI</li>
                <li>Direcionamento organizacional</li>
                <li>Acompanhamento de resultados</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="demo-cta-section">
        <div className="container">
          <div className="demo-content elevation-2">
            <div className="demo-text">
              <span className="section-tag">EXPERIMENTE A SOLUÇÃO</span>

              <h2>Acompanhe seus projetos com mais clareza</h2>

              <p>
                Acesse a plataforma e visualize como os dados das atividades de
                desenvolvimento podem ser apresentados para a gestão e a
                Governança de TI.
              </p>

              <div className="demo-features">
                <div className="demo-feature">
                  <Check size={18} />
                  <span>Dashboard de acompanhamento</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Monitoramento de Pull Requests</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Indicadores e pontos de atenção</span>
                </div>

                <div className="demo-feature">
                  <Check size={18} />
                  <span>Controle e rastreabilidade</span>
                </div>
              </div>

              <a href="/login" className="primary-button large">
                Acessar plataforma
                <ChevronRight size={18} />
              </a>
            </div>

            <div className="demo-visual">
              <div className="demo-card">
                <div className="demo-card-header">
                  <span>Acesso à plataforma</span>
                </div>

                <div className="demo-card-body">
                  <div className="demo-input">
                    <span>Usuário autorizado</span>
                  </div>

                  <div className="demo-input">
                    <span>••••••••••</span>
                  </div>

                  <button type="button" className="demo-button">
                    Entrar na plataforma
                    <ChevronRight size={16} />
                  </button>
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
              Plataforma para governança e monitoramento do progresso de
              projetos de Tecnologia da Informação.
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
              <h4>Recursos</h4>

              <a href="/login">Login</a>
              <a href="/landing#demo">Demonstração</a>
              <a href="/landing#capabilities">Monitoramento</a>
            </div>

            <div className="footer-column">
              <h4>Projeto</h4>
              <a href="#demo">Termos de uso</a>
              <a href="#demo">Privacidade</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="container">
            <p>
              © 2026 GovTech MS. Projeto acadêmico de Governança e
              Monitoramento de Projetos de TI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}