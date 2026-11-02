import { useInfiniteQuery, useQuery } from '@tanstack/react-query'

import { AUDIT_PAGE_SIZE, countAuditEvents, listAuditEvents } from '@/features/audit/api/auditApi'

// Eventos em páginas de 50 ("Carregar mais"), pelos filtros da tela
export function useAuditEvents({ organizationId, days, type }) {
  return useInfiniteQuery({
    queryKey: ['audit', organizationId, days, type],
    queryFn: ({ pageParam }) => listAuditEvents({ organizationId, days, type, before: pageParam }),
    initialPageParam: null,
    getNextPageParam: (lastPage) =>
      lastPage.length === AUDIT_PAGE_SIZE ? lastPage.at(-1).id : undefined,
    enabled: Boolean(organizationId),
  })
}

export function useAuditCounts({ organizationId, days }) {
  return useQuery({
    queryKey: ['audit-counts', organizationId, days],
    queryFn: () => countAuditEvents({ organizationId, days }),
    enabled: Boolean(organizationId),
  })
}
