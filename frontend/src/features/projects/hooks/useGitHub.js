import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  connectGitHub,
  disconnectGitHub,
  getGitHubConnection,
  listAvailableRepositories,
  selectRepositories,
  syncGitHub,
} from '@/features/projects/api/githubApi'

export function useGitHubConnection(projectId) {
  return useQuery({
    queryKey: ['github', projectId],
    queryFn: () => getGitHubConnection(projectId),
  })
}

// Lista do GitHub: só busca quando o admin abre a escolha de repositórios
export function useAvailableRepositories(projectId, enabled) {
  return useQuery({
    queryKey: ['github-available', projectId],
    queryFn: () => listAvailableRepositories(projectId),
    enabled,
    staleTime: 0,
  })
}

// Conectar, sincronizar ou remover muda também a página de Repositórios: recarrega tudo
function useGitHubMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries() })
}

export function useConnectGitHub() {
  return useGitHubMutation(connectGitHub)
}

export function useSyncGitHub() {
  return useGitHubMutation(syncGitHub)
}

export function useDisconnectGitHub() {
  return useGitHubMutation(disconnectGitHub)
}

export function useSelectRepositories() {
  return useGitHubMutation(selectRepositories)
}
