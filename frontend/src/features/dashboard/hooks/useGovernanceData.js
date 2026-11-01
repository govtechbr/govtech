import { useQuery } from '@tanstack/react-query'

import { loadGovernanceData } from '@/features/dashboard/api/governanceApi'
import { useCurrentOrganization } from '@/shared/hooks/useCurrentOrganization'

export const governanceKey = ['governance']

export function useGovernanceData() {
  const organizationId = useCurrentOrganization().organization.id

  return useQuery({
    queryKey: [...governanceKey, organizationId],
    queryFn: () => loadGovernanceData(organizationId),
  })
}
