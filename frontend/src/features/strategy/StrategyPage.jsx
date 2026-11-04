import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import DeleteObjectiveModal from './components/DeleteObjectiveModal'
import ObjectiveFormModal from './components/ObjectiveFormModal'
import ProjectAlerts from './components/ProjectAlerts'
import {
  useCreateObjective,
  useDeleteObjective,
  useMissionAndVision,
  useObjectives,
  useSaveMissionAndVision,
  useUpdateObjective,
} from '@/features/strategy/hooks/useStrategy'
import { useToast } from '@/shared/hooks/useToast'
import { PROJECT_STATUS } from '@/shared/constants/projectStatus'
import { objectiveStatus } from '@/shared/lib/strategy'
import styles from './StrategyPage.module.css'

// Missão, visão e objetivos da empresa, ligados aos projetos (docs/REGRAS_DE_NEGOCIO.md §10).
// projects e health chegam por prop (a feature de projetos é outra: ver app/routes.jsx);
// canEdit é só conveniência: quem bloqueia de verdade é o RLS (só o admin).
export default function StrategyPage({ projects = [], health = {}, canEdit = false }) {
  const { showToast } = useToast()
  const mission = useMissionAndVision()
  const objectives = useObjectives()
  const saveMission = useSaveMissionAndVision()
  const createObjective = useCreateObjective()
  const updateObjective = useUpdateObjective()
  const deleteObjective = useDeleteObjective()

  const [editingStatement, setEditingStatement] = useState(false)
  const [statementForm, setStatementForm] = useState({ mission: '', vision: '' })
  const [objectiveForm, setObjectiveForm] = useState(null) // null | 'new' | objetivo em edição
  const [objectiveToDelete, setObjectiveToDelete] = useState(null)

  async function run(action, successMessage) {
    try {
      await action()
      showToast(successMessage)
      return true
    } catch (error) {
      showToast(error.message, 'danger')
      return false
    }
  }

  function startEditingStatement() {
    setStatementForm({ mission: mission.data?.mission ?? '', vision: mission.data?.vision ?? '' })
    setEditingStatement(true)
  }

  async function submitStatement(event) {
    event.preventDefault()

    if (await run(() => saveMission.mutateAsync(statementForm), 'Missão e visão salvas.')) {
      setEditingStatement(false)
    }
  }

  async function saveObjective(data) {
    const editing = objectiveForm !== 'new' ? objectiveForm : null
    const saved = await run(
      () =>
        editing
          ? updateObjective.mutateAsync({ id: editing.id, data })
          : createObjective.mutateAsync(data),
      editing ? 'Objetivo atualizado.' : 'Objetivo criado.',
    )

    if (saved) setObjectiveForm(null)
  }

  async function confirmDelete() {
    const deleted = await run(
      () => deleteObjective.mutateAsync(objectiveToDelete.id),
      'Objetivo excluído.',
    )

    if (deleted) setObjectiveToDelete(null)
  }

  const objectiveList = objectives.data ?? []

  return (
    <section className="dashboard-content">
      <div className="page-heading">
        <div>
          <span className="page-eyebrow">DIRECIONADORES ESTRATÉGICOS</span>

          <p>
            Ligue os projetos às metas da empresa: quando um projeto entra em risco, o objetivo que
            ele sustenta aparece aqui com os motivos.
          </p>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="statement-title">
        <div className={styles.sectionHeader}>
          <h2 id="statement-title" className={styles.sectionTitle}>
            Missão e visão
          </h2>

          {canEdit && !editingStatement && (
            <button type="button" className="secondary-button" onClick={startEditingStatement}>
              <Pencil size={16} />
              Editar missão e visão
            </button>
          )}
        </div>

        {mission.isError && (
          <p className={styles.feedback} role="alert">
            Não foi possível carregar a missão e a visão.
          </p>
        )}

        {editingStatement ? (
          <form className={`${styles.card} ${styles.form}`} onSubmit={submitStatement}>
            <label className={styles.field}>
              Missão
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                maxLength={1000}
                value={statementForm.mission}
                onChange={(event) =>
                  setStatementForm((current) => ({ ...current, mission: event.target.value }))
                }
              />
            </label>

            <label className={styles.field}>
              Visão
              <textarea
                className={`${styles.input} ${styles.textarea}`}
                rows={3}
                maxLength={1000}
                value={statementForm.vision}
                onChange={(event) =>
                  setStatementForm((current) => ({ ...current, vision: event.target.value }))
                }
              />
            </label>

            <div className={styles.formActions}>
              <button type="submit" className="primary-button">
                Salvar
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => setEditingStatement(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className={`${styles.card} ${styles.statement}`}>
            <div>
              <h3 className={styles.statementLabel}>Missão</h3>
              {mission.data?.mission ? (
                <p className={styles.statementText}>{mission.data.mission}</p>
              ) : (
                <p className={`${styles.statementText} ${styles.empty}`}>Ainda não definida.</p>
              )}
            </div>

            <div>
              <h3 className={styles.statementLabel}>Visão</h3>
              {mission.data?.vision ? (
                <p className={styles.statementText}>{mission.data.vision}</p>
              ) : (
                <p className={`${styles.statementText} ${styles.empty}`}>Ainda não definida.</p>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="objectives-title">
        <div className={styles.sectionHeader}>
          <div>
            <h2 id="objectives-title" className={styles.sectionTitle}>
              Objetivos estratégicos
            </h2>
            <p className={styles.hint}>
              O status do objetivo é o pior status entre os projetos vinculados.
            </p>
          </div>

          {canEdit && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setObjectiveForm('new')}
            >
              <Plus size={16} />
              Novo objetivo
            </button>
          )}
        </div>

        {objectives.isPending && <p className={styles.feedback}>Carregando objetivos…</p>}

        {objectives.isError && (
          <p className={styles.feedback} role="alert">
            Não foi possível carregar os objetivos. Tente recarregar a página.
          </p>
        )}

        {objectives.isSuccess && objectiveList.length === 0 && (
          <p className={styles.feedback}>
            Nenhum objetivo cadastrado ainda.
            {canEdit ? ' Crie o primeiro e vincule os projetos a ele.' : ''}
          </p>
        )}

        <div className={styles.objectives}>
          {objectiveList.map((objective) => {
            const { status, projects: linked } = objectiveStatus(objective, projects, health)

            return (
              <article className={styles.card} key={objective.id}>
                <header className={styles.objectiveHeader}>
                  <div>
                    <h3 className={styles.objectiveTitle}>{objective.title}</h3>
                    {objective.description && (
                      <p className={styles.objectiveDescription}>{objective.description}</p>
                    )}
                  </div>

                  {status ? (
                    <span className={`status-badge ${status}`}>{PROJECT_STATUS[status]}</span>
                  ) : (
                    <span className={styles.noProjects}>Sem projetos vinculados</span>
                  )}
                </header>

                {linked.length > 0 && (
                  <ul className={styles.projectList}>
                    {linked.map(({ project, status: projectStatus, alerts }) => (
                      <li className={`${styles.project} ${styles[projectStatus]}`} key={project.id}>
                        <span className={styles.projectName}>{project.name}</span>

                        <ProjectAlerts alerts={alerts} />
                      </li>
                    ))}
                  </ul>
                )}

                {canEdit && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className="secondary-button"
                      aria-label={`Editar objetivo ${objective.title}`}
                      onClick={() => setObjectiveForm(objective)}
                    >
                      <Pencil size={16} />
                      Editar
                    </button>

                    <button
                      type="button"
                      className="secondary-button"
                      aria-label={`Excluir objetivo ${objective.title}`}
                      onClick={() => setObjectiveToDelete(objective)}
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      {objectiveForm && (
        <ObjectiveFormModal
          objective={objectiveForm === 'new' ? null : objectiveForm}
          onClose={() => setObjectiveForm(null)}
          onSave={saveObjective}
        />
      )}

      {objectiveToDelete && (
        <DeleteObjectiveModal
          objective={objectiveToDelete}
          onClose={() => setObjectiveToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </section>
  )
}
