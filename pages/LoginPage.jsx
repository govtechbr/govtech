import { useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronRight,
  Eye,
  LockKeyhole,
  UserRound,
} from 'lucide-react'

import Brand from '../components/common/Brand'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [toast, setToast] = useState(false)

  const submit = (event) => {
    event.preventDefault()
    setToast(true)

    window.setTimeout(() => {
      window.location.href = '/dashboard'
    }, 700)
  }

  return (
    <div className="login-page">
      <header className="public-header">
        <Brand />

        <nav className="public-nav">
          <a href="landing#capabilities" className="nav-link">Capacidades</a>

          <a className="text-link" href="/dashboard">
            Ver demonstração <ArrowUpRight size={15} />
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
              <span className="accent-text"> monitoramento de</span>
              <br />
              projetos de TI<span className="title-dot">.</span>
            </h1>

            <p className="hero-lead">
              Monitoramento automatizado de Pull Requests, prazos de projetos,
              indicadores de processo e alertas de governança.
            </p>
          </div>

          <div className="login-card elevation-3">
            <div className="login-card-top">
              <div>
                <span className="card-kicker">ACESSO CORPORATIVO</span>
                <h2>Bem-vindo de volta</h2>
                <p>Acesse a plataforma GovTech MS.</p>
              </div>

              <div className="secure-icon">
                <LockKeyhole size={20} />
              </div>
            </div>

            <form onSubmit={submit}>
              <label htmlFor="email">Email corporativo</label>

              <div className="input-wrap">
                <UserRound size={17} />

                <input
                  id="email"
                  type="email"
                  defaultValue="marina.costa@govtech.ms"
                  required
                />
              </div>

              <label htmlFor="password">Senha</label>

              <div className="input-wrap">
                <LockKeyhole size={17} />

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  defaultValue="govtech-demo"
                  required
                />

                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Eye size={17} />
                </button>
              </div>

              {/* Espaço entre senha e botão */}
              <div style={{ height: '16px' }} />

              <button className="primary-button full-width" type="submit">
                Entrar na Plataforma
                <ChevronRight size={17} />
              </button>
            </form>
          </div>
        </section>
      </main>

      {toast && (
        <div className="toast toast-success">
          <Check size={17} />
          Sessão demo iniciada. Abrindo dashboard…
        </div>
      )}
    </div>
  )
}