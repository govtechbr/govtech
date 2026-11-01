import { useQuery } from '@tanstack/react-query'

import { listRepositoryData } from '@/features/repositories/api/repositoriesApi'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'

export const repositoryDataKey = ['repository-data']

// projectId vazio = todos os projetos da empresa escolhida
export function useRepositoryData(projectId) {
  const organizationId = useCurrentOrganization().organization.id

  return useQuery({
    queryKey: [...repositoryDataKey, organizationId, projectId || 'all'],
    queryFn: () => listRepositoryData(organizationId, projectId),
  })
}
