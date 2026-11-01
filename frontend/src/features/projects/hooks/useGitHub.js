import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  connectGitHub,
  disconnectGitHub,
  getGitHubConnection,
  syncGitHub,
} from '@/features/projects/api/githubApi'

export function useGitHubConnection(projectId) {
  return useQuery({
    queryKey: ['github', projectId],
    queryFn: () => getGitHubConnection(projectId),
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
