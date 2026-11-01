import { ArrowUpRight, LockKeyhole } from 'lucide-react'

import Brand from '@/shared/ui/Brand'

// Moldura comum de login, cadastro e escolha de organização
export default function AuthLayout({ kicker, title, subtitle, children }) {
  return (
    <div className="login-page">
      <header className="public-header">
        <Brand />

        <nav className="public-nav">
          <a href="/landing#capabilities" className="nav-link">
            Capacidades
          </a>

          <a className="text-link" href="/landing">
            Conheça a plataforma <ArrowUpRight size={15} />
          </a>
        </nav>
      </header>

      <main>
        <section className="hero-section container">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-pulse" />
              v2.4 — IT GOVERNANCE PLATFORM
            </div>

            <h1>
              Governança e
              <br />
              <span className="accent-text"> monitoramento de</span>{' '}
              {/* o espaço acima evita "deprojetos" quando o <br> some no celular */}
              <br />
              projetos de TI<span className="title-dot">.</span>
            </h1>

            <p className="hero-lead">
              Monitoramento automatizado de Pull Requests, prazos de projetos, indicadores de
              processo e alertas de governança.
            </p>
          </div>

          <div className="login-card elevation-3">
            <div className="login-card-top">
              <div>
                <span className="card-kicker">{kicker}</span>
                <h2>{title}</h2>
                <p>{subtitle}</p>
              </div>

              <div className="secure-icon">
                <LockKeyhole size={20} />
              </div>
            </div>

            {children}
          </div>
        </section>
      </main>
    </div>
  )
}
