import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  listMembers,
  regenerateJoinCode,
  removeMember,
  updateMemberRole,
} from '@/features/rbac/api/membersApi'

export function useMembers(organizationId) {
  return useQuery({
    queryKey: ['members', organizationId],
    queryFn: () => listMembers(organizationId),
    enabled: Boolean(organizationId),
  })
}

// Mudar papel, remover ou trocar o código também muda as organizações do usuário
// (papel, código) e o que ele pode fazer nos projetos: recarrega tudo
function useMemberMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({ mutationFn, onSuccess: () => queryClient.invalidateQueries() })
}

export function useUpdateMemberRole() {
  return useMemberMutation(updateMemberRole)
}

export function useRemoveMember() {
  return useMemberMutation(removeMember)
}

export function useRegenerateJoinCode() {
  return useMemberMutation(regenerateJoinCode)
}
