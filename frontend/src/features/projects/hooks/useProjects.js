import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/features/projects/api/projectsApi'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'

export const projectsKey = ['projects']

export function useProjects() {
  const organizationId = useCurrentOrganization().organization.id

  return useQuery({
    queryKey: [...projectsKey, organizationId],
    queryFn: () => listProjects(organizationId),
  })
}

function useProjectMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  })
}

// O projeto novo nasce na empresa escolhida
export function useCreateProject() {
  const organizationId = useCurrentOrganization().organization.id

  return useProjectMutation((data) => createProject(organizationId, data))
}

export function useUpdateProject() {
  return useProjectMutation(({ id, data }) => updateProject(id, data))
}

export function useDeleteProject() {
  return useProjectMutation(deleteProject)
}
