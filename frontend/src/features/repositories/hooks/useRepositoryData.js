import { useQuery } from '@tanstack/react-query'

import { listRepositoryData } from '@/features/repositories/api/repositoriesApi'

export const repositoryDataKey = ['repository-data']

// projectId vazio = todos os projetos da organização
export function useRepositoryData(projectId) {
  return useQuery({
    queryKey: [...repositoryDataKey, projectId || 'all'],
    queryFn: () => listRepositoryData(projectId),
  })
}
