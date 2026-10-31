import { Download, FileSearch, Filter, ShieldCheck } from 'lucide-react'
import { auditEvents } from '../data/mockData'

export default function AuditPage() {
  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">RASTREABILIDADE E COMPLIANCE</span>
          <p>
            Acompanhe os eventos relevantes registrados nos repositórios,
            pipelines e atividades de governança.
          </p>
        </div>

        <button type="button" className="primary-button">
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="dashboard-grid three-columns">
        <article className="metric-card elevation-1">
          <span>Eventos registrados</span>
          <strong>{auditEvents.length}</strong>
          <small>Histórico disponível</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Aprovações auditadas</span>
          <strong>34</strong>
          <small>Pull Requests revisadas</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Conformidade</span>
          <strong>92%</strong>
          <small>Processos sem pendências</small>
        </article>
      </div>

      <article className="content-card elevation-1">
        <div className="content-card-header">
          <div>
            <div className="content-card-title">
              <FileSearch size={18} />
              Eventos recentes
            </div>
            <p>Registros utilizados para rastreabilidade e auditoria.</p>
          </div>

          <button type="button" className="secondary-button">
            <Filter size={16} />
            Filtrar
          </button>
        </div>

        <div className="audit-list">
          {auditEvents.slice(0, 8).map((event, index) => (
            <div className="audit-item" key={event.id || index}>
              <div className="audit-icon">
                <ShieldCheck size={16} />
              </div>

              <div className="audit-item-content">
                <strong>{event.action || 'Evento registrado'}</strong>
                <span>
                  {event.description ||
                    event.message ||
                    'Atividade registrada na trilha de auditoria.'}
                </span>
              </div>

              <small>{event.date || event.createdAt || 'Hoje'}</small>
            </div>
          ))}
        </div>
      </article>
    </section>
  )
}