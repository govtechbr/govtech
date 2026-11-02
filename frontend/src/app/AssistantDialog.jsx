import AssistantPanel from '@/features/assistant/components/AssistantPanel'
import { useGovernanceData } from '@/features/dashboard/hooks/useGovernanceData'
import { useProjects } from '@/features/projects/hooks/useProjects'
import { buildAssistantContext } from '@/shared/lib/assistantContext'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'

// Liga o assistente aos dados da Visão geral e de Projetos (uma feature não
// importa a outra; quem junta é a camada app). Só monta quando o painel abre.
export default function AssistantDialog({ onClose }) {
  const { organization } = useCurrentOrganization()
  const projects = useProjects()
  const governance = useGovernanceData()

  const context =
    projects.data && governance.data
      ? buildAssistantContext({
          organizationName: organization.name,
          projects: projects.data,
          governance: governance.data,
          now: new Date(),
        })
      : null

  return <AssistantPanel organizationId={organization.id} context={context} onClose={onClose} />
}
