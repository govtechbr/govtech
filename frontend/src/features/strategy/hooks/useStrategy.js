import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createObjective,
  deleteObjective,
  getMissionAndVision,
  listObjectives,
  saveMissionAndVision,
  updateObjective,
} from '@/features/strategy/api/strategyApi'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'

export const objectivesKey = ['objectives']
export const missionKey = ['mission-vision']

export function useObjectives() {
  const organizationId = useCurrentOrganization().organization.id

  return useQuery({
    queryKey: [...objectivesKey, organizationId],
    queryFn: () => listObjectives(organizationId),
  })
}

export function useMissionAndVision() {
  const organizationId = useCurrentOrganization().organization.id

  return useQuery({
    queryKey: [...missionKey, organizationId],
    queryFn: () => getMissionAndVision(organizationId),
  })
}

function useStrategyMutation(mutationFn, keys) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () =>
      Promise.all(keys.map((queryKey) => queryClient.invalidateQueries({ queryKey }))),
  })
}

export function useSaveMissionAndVision() {
  const organizationId = useCurrentOrganization().organization.id

  return useStrategyMutation((data) => saveMissionAndVision(organizationId, data), [missionKey])
}

export function useCreateObjective() {
  const organizationId = useCurrentOrganization().organization.id

  return useStrategyMutation((data) => createObjective(organizationId, data), [objectivesKey])
}

export function useUpdateObjective() {
  return useStrategyMutation(({ id, data }) => updateObjective(id, data), [objectivesKey])
}

// Excluir o objetivo desfaz o vínculo dos projetos: a lista de projetos também recarrega
export function useDeleteObjective() {
  return useStrategyMutation(deleteObjective, [objectivesKey, ['projects']])
}
