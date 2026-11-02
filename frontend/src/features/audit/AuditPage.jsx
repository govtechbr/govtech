import { useId, useState } from 'react'
import {
  Activity,
  Building2,
  Download,
  FolderKanban,
  GitBranch,
  Lock,
  RefreshCw,
  TriangleAlert,
  UserCog,
  Users,
} from 'lucide-react'

import styles from '@/features/audit/AuditPage.module.css'
import { AUDIT_TYPES, listAllAuditEvents } from '@/features/audit/api/auditApi'
import { useAuditCounts, useAuditEvents } from '@/features/audit/hooks/useAuditEvents'
import { describeEvent, eventType } from '@/features/audit/utils/describeEvent'
import { toCsv } from '@/features/audit/utils/toCsv'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'
import { useToast } from '@/shared/hooks/useToast'
import { formatDateTime } from '@/shared/lib/date'
import { PERIODS, DEFAULT_PERIOD } from '@/shared/lib/governance'

const TYPE_ICONS = {
  project: FolderKanban,
  member: Users,
  organization: Building2,
  github: GitBranch,
}

// Quem vê a auditoria (AU4); o banco também bloqueia
const CAN_SEE = ['admin', 'stakeholder']

function download(fileName, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

// alert: o card ganha a cor de perigo (e um ícone, para não depender só da cor)
function KpiCard({ icon: Icon, label, value, hint, alert = false }) {
  const labelId = useId()

  return (
    <article className={`${styles.kpi} ${alert ? styles.kpiAlert : ''}`} aria-labelledby={labelId}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiIcon} aria-hidden="true">
          <Icon size={16} />
        </span>
        <span id={labelId} className={styles.kpiLabel}>
          {label}
        </span>
      </div>
      <p className={styles.kpiValue}>
        {value ?? '–'}
        {alert && <TriangleAlert size={18} role="img" aria-label="Requer atenção" />}
      </p>
      <p className={styles.kpiHint}>{hint}</p>
    </article>
  )
}

export default function AuditPage() {
  const { organization } = useCurrentOrganization()

  if (!CAN_SEE.includes(organization.role)) {
    return (
      <section className="dashboard-content">
        <p className={styles.notice} role="note">
          <Lock size={16} aria-hidden="true" />A auditoria é visível só para admin e stakeholder da
          empresa.
        </p>
      </section>
    )
  }

  return <AuditTrail organization={organization} />
}

function AuditTrail({ organization }) {
  const [days, setDays] = useState(DEFAULT_PERIOD)
  const [type, setType] = useState('')
  const [exporting, setExporting] = useState(false)
  const { showToast } = useToast()
  const filters = { organizationId: organization.id, days, type }
  const events = useAuditEvents(filters)
  const counts = useAuditCounts(filters)
  const list = events.data?.pages.flat() ?? []

  async function handleExport() {
    setExporting(true)
    try {
      const all = await listAllAuditEvents(filters)
      const rows = all.map((event) => {
        const { who, what, target } = describeEvent(event)
        return [formatDateTime(event.created_at), who, what, target, event.action]
      })
      download(
        `auditoria-${days}-dias.csv`,
        toCsv(['Data e hora', 'Quem', 'O que', 'Onde', 'Ação'], rows),
      )
    } catch (error) {
      showToast(error.message, 'danger')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">RASTREABILIDADE E COMPLIANCE</span>
          <p>
            Quem fez o quê e quando: projetos, membros, empresa e integração com o GitHub. Os
            eventos não podem ser alterados nem apagados.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={handleExport}
          disabled={exporting || list.length === 0}
        >
          <Download size={16} aria-hidden="true" />
          {exporting ? 'Gerando CSV…' : 'Exportar CSV'}
        </button>
      </div>

      <div className={styles.filters}>
        <div className={styles.segmented} role="group" aria-label="Período">
          {PERIODS.map((period) => (
            <button
              key={period}
              type="button"
              aria-pressed={days === period}
              onClick={() => setDays(period)}
            >
              {period} dias
            </button>
          ))}
        </div>

        <div className={styles.segmented} role="group" aria-label="Tipo de evento">
          <button type="button" aria-pressed={type === ''} onClick={() => setType('')}>
            Todos
          </button>
          {Object.entries(AUDIT_TYPES).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={type === key}
              onClick={() => setType(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.kpis}>
        <KpiCard
          icon={Activity}
          label="Eventos registrados"
          value={counts.data?.total}
          hint={`Nos últimos ${days} dias`}
        />
        <KpiCard
          icon={UserCog}
          label="Mudanças de acesso"
          value={counts.data?.accessChanges}
          hint="Entradas, saídas e trocas de papel"
        />
        <KpiCard
          icon={RefreshCw}
          label="Sincronizações com falha"
          value={counts.data?.failedSyncs}
          hint="Integração com o GitHub"
          alert={counts.data?.failedSyncs > 0}
        />
      </div>

      <article className={`content-card elevation-1 ${styles.events}`}>
        <div className="content-card-header">
          <div>
            <h2 className={styles.title}>Eventos</h2>
            <p>Do mais recente ao mais antigo.</p>
          </div>
        </div>

        {events.isPending && <p className={styles.state}>Carregando a auditoria…</p>}
        {events.isError && (
          <p className={`${styles.state} ${styles.error}`} role="alert">
            {events.error.message}
          </p>
        )}
        {events.isSuccess && list.length === 0 && (
          <p className={styles.state}>Nenhum evento neste período.</p>
        )}

        {list.length > 0 && (
          <ol className={styles.list}>
            {list.map((event) => {
              const { who, what, target } = describeEvent(event)
              const kind = eventType(event)
              const Icon = TYPE_ICONS[kind] ?? FolderKanban

              return (
                <li key={event.id} className={styles.item}>
                  <span
                    className={`${styles.icon} ${event.action === 'github.sync_failed' ? styles.failed : ''}`}
                    aria-hidden="true"
                  >
                    <Icon size={16} />
                  </span>
                  <div className={styles.body}>
                    <p className={styles.what}>
                      {what}
                      {target && <span className={styles.target}> · {target}</span>}
                    </p>
                    <p className={styles.meta}>
                      {who} · <span className={styles.kind}>{AUDIT_TYPES[kind]}</span>
                    </p>
                  </div>
                  <time className={styles.time} dateTime={event.created_at}>
                    {formatDateTime(event.created_at)}
                  </time>
                </li>
              )
            })}
          </ol>
        )}

        {events.hasNextPage && (
          <button
            type="button"
            className={`secondary-button ${styles.more}`}
            onClick={() => events.fetchNextPage()}
            disabled={events.isFetchingNextPage}
          >
            {events.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </button>
        )}
      </article>
    </section>
  )
}
