import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
} from '@/features/projects/api/projectsApi'

export const projectsKey = ['projects']

export function useProjects() {
  return useQuery({ queryKey: projectsKey, queryFn: listProjects })
}

function useProjectMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectsKey }),
  })
}

export function useCreateProject() {
  return useProjectMutation(createProject)
}

export function useUpdateProject() {
  return useProjectMutation(({ id, data }) => updateProject(id, data))
}

export function useDeleteProject() {
  return useProjectMutation(deleteProject)
}
