import { QueryClientProvider } from '@tanstack/react-query'
import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AppLayout from '@/app/AppLayout'
import { createQueryClient } from '@/app/queryClient'
import { OverviewRoute, ProjectsRoute, SettingsRoute } from '@/app/routes'
import AuditPage from '@/features/audit/AuditPage'
import LoginPage from '@/features/auth/LoginPage'
import RbacPage from '@/features/rbac/RbacPage'
import RepositoriesPage from '@/features/repositories/RepositoriesPage'
import ToastProvider from '@/shared/ui/ToastProvider'

// A landing é grande e não faz parte do sistema: só carrega quando alguém abre /landing
const LandingPage = lazy(() => import('@/landing/LandingPage'))

export default function App() {
  const [queryClient] = useState(createQueryClient)

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/landing"
            element={
              <Suspense fallback={null}>
                <LandingPage />
              </Suspense>
            }
          />

          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<OverviewRoute />} />
            <Route path="/audit" element={<AuditPage />} />
            <Route path="/repositories" element={<RepositoriesPage />} />
            <Route path="/projects" element={<ProjectsRoute />} />
            <Route path="/access" element={<RbacPage />} />
            <Route path="/settings" element={<SettingsRoute />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ToastProvider>
    </QueryClientProvider>
  )
}
