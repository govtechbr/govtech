import { CalendarClock, CircleAlert, FolderKanban, Plus, Users } from 'lucide-react'
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
import { useToast } from '@/shared/hooks/useToast'
import styles from './ProjectsPage.module.css'

// permissions vem do papel do usuário (adaptador em app/routes.jsx). Esconder o
// botão é só conveniência: quem bloqueia de verdade é o RLS do banco.
const allowAll = { create: true, edit: true, delete: true, manageGitHub: true, syncGitHub: true }
const healthy = { status: 'success', alerts: [] }

// health: { [projectId]: { status, alerts } }, calculado pelos alertas (regra P3)
// scores: { [projectId]: linha mais recente do Índice de Governança } (regra I1)
export default function ProjectsPage({
  initialProjectId,
  permissions = allowAll,
  health = {},
  scores = {},
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
  const countStatus = (status) =>
    projectList.filter((project) => healthOf(project).status === status).length

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
            Acompanhe prazos, responsáveis, progresso e sinais de risco dos projetos monitorados
            pela plataforma.
          </p>
        </div>

        {permissions.create && (
          <button type="button" className="primary-button" onClick={openCreateForm}>
            <Plus size={16} />
            Novo projeto
          </button>
        )}
      </div>

      <div className="dashboard-grid three-columns">
        <article className="metric-card elevation-1">
          <span>Projetos ativos</span>
          <strong>{projectList.length}</strong>
          <small>Em acompanhamento</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Em atenção</span>
          <strong>{countStatus('warning')}</strong>
          <small>Exigem acompanhamento</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Em risco</span>
          <strong>{countStatus('danger')}</strong>
          <small>Com alerta de risco</small>
        </article>
      </div>

      {isPending && <p className={styles.feedback}>Carregando projetos…</p>}

      {isError && (
        <p className={styles.feedback} role="alert">
          Não foi possível carregar os projetos. Tente recarregar a página.
        </p>
      )}

      <div className="project-grid" aria-busy={isPending}>
        {projectList.map((project) => {
          const { status, alerts } = healthOf(project)
          const score = scores[project.id]?.score ?? null

          return (
            <article className={`project-card elevation-1 ${styles.card}`} key={project.id}>
              <div className="project-card-top">
                <div className="project-icon">
                  <FolderKanban size={19} />
                </div>

                <span className={`status-badge ${status}`}>{PROJECT_STATUS[status]}</span>
              </div>

              <h3>
                {/* O botão cobre o cartão inteiro (::after), então clique e teclado funcionam em todo ele */}
                <button
                  type="button"
                  className={styles.cardButton}
                  onClick={() => handleProjectClick(project)}
                >
                  {project.name}
                </button>
              </h3>

              <div className="project-meta">
                <span>
                  <Users size={15} />
                  {project.owner}
                </span>

                <span>
                  <CalendarClock size={15} />
                  {project.deadline}
                </span>
              </div>

              <div className="project-progress">
                <div>
                  <span>Progresso</span>
                  <strong>{project.progress}%</strong>
                </div>

                <div className="progress-track">
                  <span style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              {score !== null && (
                <p className={`${styles.index} ${styles[scoreBand(score)]}`}>
                  Índice de Governança <strong>{score}</strong>
                  <small>{SCORE_BANDS[scoreBand(score)]}</small>
                </p>
              )}

              {alerts.length > 0 && (
                <div className="project-alert">
                  <CircleAlert size={15} />
                  {alerts.length === 1
                    ? alerts[0].title
                    : `${alerts.length} alertas: ${alerts[0].title}`}
                </div>
              )}
            </article>
          )
        })}
      </div>

      {showForm && (
        <ProjectFormModal project={editingProject} onClose={closeForm} onSave={saveProject} />
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
