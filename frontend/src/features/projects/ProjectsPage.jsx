import {
  CalendarClock,
  ChevronRight,
  Flag,
  FolderKanban,
  OctagonAlert,
  Plus,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'

import DeleteProjectModal from './components/DeleteProjectModal'
import ProjectDetailModal from './components/ProjectDetailModal'
import ProjectFormModal from './components/ProjectFormModal'
import {
  useCreateProject,
  useDeleteProject,
  useProjects,
  useUpdateProject,
} from '@/features/projects/hooks/useProjects'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { SCORE_BANDS, scoreBand } from '@/shared/lib/governanceScore'
import { formatProjectDate } from '@/shared/lib/projectUtils'
import { useToast } from '@/shared/hooks/useToast'
import styles from './ProjectsPage.module.css'

// permissions vem do papel do usuário (adaptador em app/routes.jsx). Esconder o
// botão é só conveniência: quem bloqueia de verdade é o RLS do banco.
const allowAll = { create: true, edit: true, delete: true, manageGitHub: true, syncGitHub: true }
const healthy = { status: 'success', alerts: [] }

// health: { [projectId]: { status, alerts } }, calculado pelos alertas (regra P3)
// scores: { [projectId]: linha mais recente do Índice de Governança } (regra I1)
// objectives: objetivos estratégicos da empresa, para o vínculo do projeto (regra S3)
export default function ProjectsPage({
  initialProjectId,
  permissions = allowAll,
  health = {},
  scores = {},
  objectives = [],
}) {
  const { showToast } = useToast()
  const { data: projectList = [], isPending, isError } = useProjects()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const deleteProject = useDeleteProject()

  const [showForm, setShowForm] = useState(false)
  // Guarda o id (não o objeto) para o detalhe sempre mostrar o dado atual da query
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId ?? null)
  const [editingProject, setEditingProject] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const selectedProject = projectList.find((project) => project.id === selectedProjectId) ?? null
  const healthOf = (project) => health[project.id] ?? healthy
  const objectiveOf = (project) => objectives.find(({ id }) => id === project.objectiveId)
  const countStatus = (status) =>
    projectList.filter((project) => healthOf(project).status === status).length

  // Cartões de resumo: os números vêm do status calculado (regra P3)
  const summary = [
    {
      label: 'Projetos ativos',
      value: projectList.length,
      legend: 'Em acompanhamento',
      Icon: FolderKanban,
      tone: 'primary',
    },
    {
      label: 'Em atenção',
      value: countStatus('warning'),
      legend: 'Exigem acompanhamento',
      Icon: TriangleAlert,
      tone: 'warning',
    },
    {
      label: 'Em risco',
      value: countStatus('danger'),
      legend: 'Com alerta de risco',
      Icon: OctagonAlert,
      tone: 'danger',
    },
  ]

  const openCreateForm = () => {
    setEditingProject(null)
    setShowForm(true)
  }

  const openEditForm = (project) => {
    setSelectedProjectId(null)
    setEditingProject(project)
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingProject(null)
  }

  const saveProject = async (formData) => {
    try {
      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, data: formData })
        showToast('Projeto atualizado com sucesso.')
      } else {
        await createProject.mutateAsync(formData)
        showToast('Projeto criado com sucesso.')
      }

      closeForm()
    } catch (error) {
      // A API já devolve a mensagem pronta (ex.: sem permissão para alterar)
      showToast(error.message, 'danger')
    }
  }

  const confirmDelete = async () => {
    if (!selectedProject) return

    try {
      await deleteProject.mutateAsync(selectedProject.id)
      setSelectedProjectId(null)
      setShowDeleteConfirm(false)
      showToast('Projeto excluído com sucesso.', 'warning')
    } catch (error) {
      showToast(error.message, 'danger')
    }
  }

  const handleProjectClick = (project) => {
    setSelectedProjectId(project.id)
  }

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">PORTFÓLIO E ACOMPANHAMENTO</span>

          <p>
            Acompanhe prazos, responsáveis, Índice de Governança e sinais de risco dos projetos
            monitorados pela plataforma.
          </p>
        </div>

        {permissions.create && (
          <button type="button" className="primary-button" onClick={openCreateForm}>
            <Plus size={16} />
            Novo projeto
          </button>
        )}
      </div>

      <div className={styles.summary}>
        {summary.map(({ label, value, legend, Icon, tone }) => (
          <article className={`${styles.kpi} ${styles[tone]}`} key={label}>
            <span className={styles.kpiLabel}>
              <span className={styles.kpiIcon}>
                <Icon size={16} aria-hidden="true" />
              </span>
              {label}
            </span>
            <strong className={styles.kpiValue}>{value}</strong>
            <small className={styles.kpiLegend}>{legend}</small>
          </article>
        ))}
      </div>

      {isPending && <p className={styles.feedback}>Carregando projetos…</p>}

      {isError && (
        <p className={styles.feedback} role="alert">
          Não foi possível carregar os projetos. Tente recarregar a página.
        </p>
      )}

      <div className={styles.grid} aria-busy={isPending}>
        {projectList.map((project) => {
          const { status } = healthOf(project)
          const score = scores[project.id]?.score ?? null
          const band = scoreBand(score)

          return (
            <article className={styles.card} key={project.id}>
              <header className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>
                  {/* O botão cobre o cartão inteiro (::after), então clique e teclado funcionam em todo ele */}
                  <button
                    type="button"
                    className={styles.cardButton}
                    onClick={() => handleProjectClick(project)}
                  >
                    {project.name}
                  </button>
                </h3>

                <span className={`status-badge ${status}`}>{PROJECT_STATUS[status]}</span>
              </header>

              <dl className={styles.meta}>
                <div>
                  <dt>
                    <UserRound size={15} aria-hidden="true" />
                    Responsável
                  </dt>
                  <dd>{project.owner}</dd>
                </div>

                {objectiveOf(project) && (
                  <div>
                    <dt>
                      <Flag size={15} aria-hidden="true" />
                      Objetivo
                    </dt>
                    <dd>{objectiveOf(project).title}</dd>
                  </div>
                )}

                <div>
                  <dt>
                    <CalendarClock size={15} aria-hidden="true" />
                    Prazo
                  </dt>
                  <dd>{formatProjectDate(project.deadline)}</dd>
                </div>
              </dl>

              <footer className={styles.cardFooter}>
                {score === null ? (
                  <p className={styles.noScore}>Índice de Governança ainda não apurado</p>
                ) : (
                  <p className={`${styles.score} ${styles[band]}`}>
                    <strong className={styles.scoreValue}>{score}</strong>
                    <span className={styles.scoreText}>
                      Índice de Governança
                      <span className={styles.scoreBand}>{SCORE_BANDS[band]}</span>
                    </span>
                  </p>
                )}

                <span className={styles.open} aria-hidden="true">
                  Detalhes
                  <ChevronRight size={16} />
                </span>
              </footer>
            </article>
          )
        })}
      </div>

      {showForm && (
        <ProjectFormModal
          project={editingProject}
          objectives={objectives}
          onClose={closeForm}
          onSave={saveProject}
        />
      )}

      {selectedProject && !showDeleteConfirm && (
        <ProjectDetailModal
          project={selectedProject}
          health={healthOf(selectedProject)}
          score={scores[selectedProject.id] ?? null}
          onClose={() => setSelectedProjectId(null)}
          github={{ canManage: permissions.manageGitHub, canSync: permissions.syncGitHub }}
          onEdit={permissions.edit ? () => openEditForm(selectedProject) : null}
          onDelete={permissions.delete ? () => setShowDeleteConfirm(true) : null}
        />
      )}

      {showDeleteConfirm && selectedProject && (
        <DeleteProjectModal
          project={selectedProject}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
