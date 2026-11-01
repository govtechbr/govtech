import { CalendarClock, CircleAlert, FolderKanban, Plus, Users } from 'lucide-react'
import { useState } from 'react'

import DeleteProjectModal from './components/DeleteProjectModal'
import ProjectDetailModal from './components/ProjectDetailModal'
import ProjectFormModal from './components/ProjectFormModal'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { useToast } from '@/shared/hooks/useToast'
import { normalizeProject } from '@/shared/lib/projectUtils'

export default function ProjectsPage({ projectList = [], setProjectList, initialProjectId }) {
  const { showToast: onToast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [selectedProject, setSelectedProject] = useState(
    () => projectList.find((project) => project.id === initialProjectId) ?? null,
  )
  const [editingProject, setEditingProject] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const safeProjects = Array.isArray(projectList) && projectList.length > 0 ? projectList : []

  const openCreateForm = () => {
    setEditingProject(null)
    setShowForm(true)
  }

  const openEditForm = (project) => {
    setSelectedProject(null)
    setEditingProject(project)
    setShowForm(true)
  }

  const saveProject = (formData) => {
    if (editingProject) {
      setProjectList((current) =>
        current.map((project) =>
          project.id === editingProject.id
            ? normalizeProject({
                ...project,
                ...formData,
              })
            : project,
        ),
      )

      onToast('Projeto atualizado com sucesso.')
    } else {
      setProjectList((current) => [
        ...current,
        normalizeProject({
          id: Date.now(),
          ...formData,
        }),
      ])

      onToast('Projeto criado com sucesso.')
    }

    setShowForm(false)
    setEditingProject(null)
  }

  const deleteProject = () => {
    if (!selectedProject) return

    setProjectList((current) => current.filter((project) => project.id !== selectedProject.id))

    setSelectedProject(null)
    setShowDeleteConfirm(false)
    onToast('Projeto excluído com sucesso.', 'warning')
  }

  const handleProjectClick = (project) => {
    setSelectedProject(project)
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

        <button type="button" className="primary-button" onClick={openCreateForm}>
          <Plus size={16} />
          Novo projeto
        </button>
      </div>

      <div className="dashboard-grid three-columns">
        <article className="metric-card elevation-1">
          <span>Projetos ativos</span>
          <strong>{safeProjects.length}</strong>
          <small>Em acompanhamento</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Em atenção</span>
          <strong>{safeProjects.filter((p) => p.status === 'warning').length}</strong>
          <small>Exigem acompanhamento</small>
        </article>

        <article className="metric-card elevation-1">
          <span>Riscos críticos</span>
          <strong>{safeProjects.filter((p) => p.status === 'danger').length}</strong>
          <small>Impacto potencial em prazo</small>
        </article>
      </div>

      <div className="project-grid">
        {safeProjects.map((project) => (
          <article
            className="project-card elevation-1"
            key={project.id}
            onClick={() => handleProjectClick(project)}
            style={{ cursor: 'pointer' }}
          >
            <div className="project-card-top">
              <div className="project-icon">
                <FolderKanban size={19} />
              </div>

              <span className={`status-badge ${project.status}`}>
                {PROJECT_STATUS[project.status]}
              </span>
            </div>

            <h3>{project.name}</h3>

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

            {project.status === 'danger' && (
              <div className="project-alert">
                <CircleAlert size={15} />
                Dependências pendentes podem afetar o prazo.
              </div>
            )}
          </article>
        ))}
      </div>

      {showForm && (
        <ProjectFormModal
          project={editingProject}
          onClose={() => {
            setEditingProject(null)
            setShowForm(false)
          }}
          onSave={saveProject}
        />
      )}

      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onEdit={() => openEditForm(selectedProject)}
          onDelete={() => setShowDeleteConfirm(true)}
        />
      )}

      {showDeleteConfirm && selectedProject && (
        <DeleteProjectModal
          project={selectedProject}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={deleteProject}
        />
      )}
    </section>
  )
}
